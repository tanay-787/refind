import { AppState } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidForegroundServiceType,
  AndroidForegroundServiceBehavior,
  AndroidCategory,
  AuthorizationStatus,
} from 'react-native-notify-kit';

export const NOTIFICATION_ID = 'job_journal_sync';
export const COMPLETION_NOTIFICATION_ID = 'job_journal_completion';
export const CHANNEL_ID = 'refind_indexing_channel';
export const ALERTS_CHANNEL_ID = 'refind_alerts_channel';
export const BRAND_COLOR = '#208AEF';

export const NOTIFICATION_ACTION_PAUSE = 'engine_pause';
export const NOTIFICATION_ACTION_RESUME = 'engine_resume';

let isChannelCreated = false;
let isForegroundServiceRunning = false;
let lastProgressUpdateTime = 0;
// Throttle notification updates to prevent Android NotificationManager rate limiting
const MIN_UPDATE_INTERVAL_MS = 600;

let foregroundServiceResolver: (() => void) | null = null;
let completionDismissTimeout: ReturnType<typeof setTimeout> | null = null;

export async function setupNotificationChannel() {
  if (isChannelCreated) return;
  try {
    // Delete legacy channels that may have cached low importance on device
    try {
      await notifee.deleteChannel('job_journal_channel');
      await notifee.deleteChannel('refind_indexing_channel_v2');
    } catch {
      // Ignore cleanup errors
    }

    // Ongoing progress channel (silent in shade)
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Screenshot Indexing',
      description: 'Ongoing progress when indexing screenshots on-device',
      importance: AndroidImportance.DEFAULT,
      vibration: false,
    });

    // Milestone and completion channel (heads-up notification alert without vibration)
    await notifee.createChannel({
      id: ALERTS_CHANNEL_ID,
      name: 'Indexing Alerts & Completion',
      description: 'Alerts when indexing or screenshot discovery completes',
      importance: AndroidImportance.HIGH,
      vibration: false,
    });

    isChannelCreated = true;
    if (typeof notifee.prewarmForegroundService === 'function') {
      await notifee.prewarmForegroundService();
    }
  } catch (err) {
    console.error('[notifications] Failed to create notification channel:', err);
  }
}

/**
 * Ensures notification permission is granted on Android 13+ (API 33+).
 * Prompts the user if permission is not yet determined.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      return true;
    }
    if (settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED) {
      const requested = await notifee.requestPermission();
      return requested.authorizationStatus === AuthorizationStatus.AUTHORIZED;
    }
    console.warn('[notifications] Notification permission not granted (status:', settings.authorizationStatus, ')');
    return false;
  } catch (err) {
    console.error('[notifications] Error checking notification permission:', err);
    return false;
  }
}

/**
 * Displays an indeterminate discovery notification during photo library intake.
 */
export async function startDiscoveryNotification(): Promise<boolean> {
  try {
    if (AppState.currentState !== 'active') return false;
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return false;

    if (completionDismissTimeout) {
      clearTimeout(completionDismissTimeout);
      completionDismissTimeout = null;
    }

    await setupNotificationChannel();

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Discovering screenshots',
      body: 'Scanning photo library for new screenshots…',
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        ongoing: true,
        onlyAlertOnce: true,
        color: BRAND_COLOR,
        progress: {
          indeterminate: true,
        },
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });
    return true;
  } catch (err) {
    console.error('[notifications] Failed to show discovery notification:', err);
    return false;
  }
}

/**
 * Starts an ongoing Android foreground service notification with native progress bar.
 */
export async function startSyncForegroundService(current = 0, total = 0): Promise<boolean> {
  try {
    // Android 12+ prevents starting foreground services from the background
    if (AppState.currentState !== 'active') {
      console.log(`[notifications] AppState is '${AppState.currentState}', skipping foreground service start.`);
      return false;
    }

    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) {
      console.warn('[notifications] Notification permission not granted, foreground service notification will not appear.');
      return false;
    }

    if (completionDismissTimeout) {
      clearTimeout(completionDismissTimeout);
      completionDismissTimeout = null;
    }

    await setupNotificationChannel();
    lastProgressUpdateTime = Date.now();

    const hasTotal = total > 0;
    const title = hasTotal
      ? `Indexing ${total === 1 ? '1 screenshot' : `${total.toLocaleString()} screenshots`}`
      : 'Indexing screenshots';
    const percentage = hasTotal ? Math.round((current / total) * 100) : 0;
    const body = hasTotal
      ? `${current.toLocaleString()} of ${total.toLocaleString()} indexed`
      : 'Indexing screenshots in background…';

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title,
      body,
      subtitle: hasTotal ? `${percentage}%` : undefined,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        asForegroundService: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC],
        foregroundServiceBehavior: AndroidForegroundServiceBehavior.IMMEDIATE,
        ongoing: true,
        onlyAlertOnce: true,
        color: BRAND_COLOR,
        progress: hasTotal
          ? {
              max: total,
              current,
              indeterminate: false,
            }
          : {
              indeterminate: true,
            },
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          {
            title: 'Pause',
            pressAction: { id: NOTIFICATION_ACTION_PAUSE },
          },
        ],
      },
    });
    isForegroundServiceRunning = true;
    return true;
  } catch (err) {
    isForegroundServiceRunning = false;
    console.error('[notifications] Failed to display foreground notification:', err);
    return false;
  }
}

/**
 * Updates the ongoing notification progress bar with rate limiting.
 * Note: Does not set `asForegroundService: true` on updates to avoid re-triggering
 * `startForegroundService()` from background contexts (Android 12+ restriction).
 */
export async function updateSyncNotificationProgress(
  current: number,
  total: number,
  force = false,
) {
  if (!isForegroundServiceRunning) {
    // If resuming from detached paused state, re-establish foreground service when active
    if (AppState.currentState === 'active') {
      await startSyncForegroundService(current, total);
      return;
    }
    return;
  }

  const now = Date.now();
  if (!force && now - lastProgressUpdateTime < MIN_UPDATE_INTERVAL_MS) {
    return;
  }
  lastProgressUpdateTime = now;

  try {
    const hasTotal = total > 0;
    const title = hasTotal
      ? `Indexing ${total === 1 ? '1 screenshot' : `${total.toLocaleString()} screenshots`}`
      : 'Indexing screenshots';
    const percentage = hasTotal ? Math.round((Math.min(current, total) / total) * 100) : 0;
    const body = hasTotal
      ? `${current.toLocaleString()} of ${total.toLocaleString()} indexed`
      : `Processed ${current.toLocaleString()} screenshots`;

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title,
      body,
      subtitle: hasTotal ? `${percentage}%` : undefined,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        ongoing: true,
        onlyAlertOnce: true,
        color: BRAND_COLOR,
        progress: hasTotal
          ? {
              max: total,
              current,
              indeterminate: false,
            }
          : {
              indeterminate: true,
            },
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          {
            title: 'Pause',
            pressAction: { id: NOTIFICATION_ACTION_PAUSE },
          },
        ],
      },
    });
  } catch (err) {
    console.error('[notifications] Failed to update progress notification:', err);
  }
}

/**
 * Displays paused state on the notification in-place with a Resume action.
 * Detaches the foreground service so the notification becomes swipable/dismissible.
 */
export async function showPausedSyncNotification(
  current: number,
  total: number,
): Promise<void> {
  // Detach foreground service so user can freely swipe/destroy the notification
  if (isForegroundServiceRunning) {
    isForegroundServiceRunning = false;
    try {
      await notifee.stopForegroundService();
    } catch (err) {
      console.warn('[notifications] Failed to stop foreground service on pause:', err);
    }
  }

  try {
    const hasTotal = total > 0;
    const title = 'Indexing paused';
    const body = hasTotal
      ? `${current.toLocaleString()} of ${total.toLocaleString()} indexed`
      : `Processed ${current.toLocaleString()} screenshots`;

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title,
      body,
      subtitle: undefined,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        ongoing: false, // <-- Swipable & destroyable by user
        autoCancel: true,
        onlyAlertOnce: true,
        color: BRAND_COLOR,
        progress: hasTotal
          ? {
              max: total,
              current,
              indeterminate: false,
            }
          : undefined,
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          {
            title: 'Resume',
            pressAction: { id: NOTIFICATION_ACTION_RESUME, launchActivity: 'default' },
          },
        ],
      },
    });
  } catch (err) {
    console.error('[notifications] Failed to show paused notification:', err);
  }
}

/**
 * Displays completion state on the exact same notification in-place.
 * Stops the foreground service, clears the progress bar, marks ongoing: false,
 * and auto-dismisses after 6 seconds.
 */
export async function showIndexingCompleteNotification(total: number): Promise<void> {
  isForegroundServiceRunning = false;
  if (foregroundServiceResolver) {
    foregroundServiceResolver();
    foregroundServiceResolver = null;
  }
  try {
    await notifee.stopForegroundService();
  } catch (err) {
    console.error('[notifications] Failed to stop foreground service:', err);
  }

  try {
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return;

    if (completionDismissTimeout) {
      clearTimeout(completionDismissTimeout);
      completionDismissTimeout = null;
    }

    const body = total === 1
      ? 'Made 1 screenshot searchable'
      : `Made ${total.toLocaleString()} screenshots searchable`;

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Indexing complete',
      body,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.STATUS,
        color: BRAND_COLOR,
        ongoing: false,
        autoCancel: true,
        onlyAlertOnce: true,
        pressAction: { id: 'default', launchActivity: 'default' },
      },
    });

    // Automatically dismiss the completion banner after 6 seconds to keep tray tidy
    completionDismissTimeout = setTimeout(async () => {
      try {
        await notifee.cancelNotification(NOTIFICATION_ID);
      } catch {
        // Ignore cancel errors
      }
    }, 6000);
  } catch (err) {
    console.error('[notifications] Failed to display completion notification:', err);
  }
}

/**
 * Stops the Android foreground service and removes the ongoing notification.
 */
export async function stopSyncForegroundService() {
  isForegroundServiceRunning = false;
  if (foregroundServiceResolver) {
    foregroundServiceResolver();
    foregroundServiceResolver = null;
  }
  try {
    await notifee.stopForegroundService();
  } catch (err) {
    console.error('[notifications] Failed to stop foreground service:', err);
  }
  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch (err) {
    console.error('[notifications] Failed to cancel notification:', err);
  }
}

/**
 * Attaches the headless task resolver so the foreground service Promise remains pending.
 */
export function setForegroundServiceResolver(resolve: () => void) {
  foregroundServiceResolver = resolve;
}

// Backwards-compatible aliases
export async function updateSyncNotification(current = 0, total = 0) {
  return await startSyncForegroundService(current, total);
}

export async function clearSyncNotification() {
  return await stopSyncForegroundService();
}
