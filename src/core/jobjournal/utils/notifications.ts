import notifee, { AndroidImportance } from 'react-native-notify-kit';

export const NOTIFICATION_ID = 'job_journal_sync';
export const CHANNEL_ID = 'job_journal_channel';

let isChannelCreated = false;
let isForegroundServiceRunning = false;
let lastProgressUpdateTime = 0;
// Throttle notification updates to prevent Android NotificationManager rate limiting
const MIN_UPDATE_INTERVAL_MS = 600;

export async function setupNotificationChannel() {
  if (isChannelCreated) return;
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Screenshot Processing',
      description: 'Ongoing progress when indexing screenshots on-device',
      importance: AndroidImportance.LOW,
      vibration: false,
    });
    isChannelCreated = true;
    // Prewarm foreground service classes to eliminate launch latency
    if (typeof notifee.prewarmForegroundService === 'function') {
      await notifee.prewarmForegroundService();
    }
  } catch {
    // Fail silently if permissions or environment are not ready
  }
}

/**
 * Starts an ongoing Android foreground service notification with native progress bar.
 */
export async function startSyncForegroundService(current = 0, total = 0) {
  try {
    await setupNotificationChannel();
    isForegroundServiceRunning = true;
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
        asForegroundService: true,
        ongoing: true,
        onlyAlertOnce: true,
        smallIcon: 'ic_launcher',
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
    console.warn('[notifications] Failed to start foreground service:', err);
  }
}

/**
 * Updates the foreground notification progress bar with rate limiting.
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
        asForegroundService: true,
        ongoing: true,
        onlyAlertOnce: true,
        smallIcon: 'ic_launcher',
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
  } catch {
    // Fail silently
  }
}

/**
 * Stops the Android foreground service and removes the ongoing notification.
 */
export async function stopSyncForegroundService() {
  isForegroundServiceRunning = false;
  try {
    await notifee.stopForegroundService();
  } catch {
    // Fail silently
  }
  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch {
    // Fail silently
  }
}

// Backwards-compatible aliases
export async function updateSyncNotification(current = 0, total = 0) {
  return await startSyncForegroundService(current, total);
}

export async function clearSyncNotification() {
  return await stopSyncForegroundService();
}
