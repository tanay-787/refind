import notifee, { AndroidImportance } from 'react-native-notify-kit';

const NOTIFICATION_ID = 'job_journal_sync';
const CHANNEL_ID = 'job_journal_channel';

export async function setupNotificationChannel() {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Background Processing',
    importance: AndroidImportance.LOW,
  });
}

export async function updateSyncNotification() {
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
}

export async function clearSyncNotification() {
  await notifee.cancelNotification(NOTIFICATION_ID);
}
