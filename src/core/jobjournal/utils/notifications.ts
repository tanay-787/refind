import notifee, { AndroidImportance } from 'react-native-notify-kit';

const NOTIFICATION_ID = 'job_journal_sync';
const CHANNEL_ID = 'job_journal_channel';

export async function setupNotificationChannel() {
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Background Processing',
      importance: AndroidImportance.LOW,
    });
  } catch (err) {
    // Fail silently if permission is missing
  }
}

export async function updateSyncNotification() {
  try {
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'Processing screenshots',
      body: 'Syncing in the background...',
      android: {
        channelId: CHANNEL_ID,
        ongoing: true,
        progress: { indeterminate: true },
        smallIcon: 'ic_launcher',
      },
    });
  } catch (err) {
    // Fail silently if permission is missing
  }
}

export async function clearSyncNotification() {
  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch (err) {
    // Fail silently
  }
}
