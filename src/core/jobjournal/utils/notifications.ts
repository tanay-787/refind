import { AppState } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidForegroundServiceType,
  AndroidForegroundServiceBehavior,
  AndroidCategory,
  AuthorizationStatus,
} from 'react-native-notify-kit';

export const NOTIFICATION_ID = 'job_journal_sync';
export const CHANNEL_ID = 'refind_indexing_channel';

let isChannelCreated = false;
let isForegroundServiceRunning = false;
let lastProgressUpdateTime = 0;
// Throttle notification updates to prevent Android NotificationManager rate limiting
const MIN_UPDATE_INTERVAL_MS = 600;

let foregroundServiceResolver: (() => void) | null = null;

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

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Screenshot Indexing',
      description: 'Ongoing progress when indexing screenshots on-device',
      importance: AndroidImportance.DEFAULT,
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

    await setupNotificationChannel();
    lastProgressUpdateTime = Date.now();

    const hasTotal = total > 0;
    const body = hasTotal
      ? `Indexing ${current} of ${total} screenshots...`
      : 'Indexing screenshots in background...';

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Indexing screenshots',
      body,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        asForegroundService: true,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC],
        foregroundServiceBehavior: AndroidForegroundServiceBehavior.IMMEDIATE,
        ongoing: true,
        onlyAlertOnce: true,
        progress: hasTotal
          ? {
              max: total,
              current,
              indeterminate: false,
            }
          : {
              indeterminate: true,
            },
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
  if (!isForegroundServiceRunning) return;

  const now = Date.now();
  if (!force && now - lastProgressUpdateTime < MIN_UPDATE_INTERVAL_MS) {
    return;
  }
  lastProgressUpdateTime = now;

  try {
    const hasTotal = total > 0;
    const body = hasTotal
      ? `Indexed ${current} of ${total} screenshots`
      : `Processed ${current} screenshots`;

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Indexing screenshots',
      body,
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.PROGRESS,
        ongoing: true,
        onlyAlertOnce: true,
        progress: hasTotal
          ? {
              max: total,
              current,
              indeterminate: false,
            }
          : {
              indeterminate: true,
            },
      },
    });
  } catch (err) {
    console.error('[notifications] Failed to update progress notification:', err);
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
