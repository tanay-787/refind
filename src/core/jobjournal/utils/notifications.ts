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

export async function updateSyncNotification(processed: number, total: number | null) {
  const progressText = total ? `Processed ${processed} of ${total} tasks...` : `Processed ${processed} tasks...`;
  await notifee.displayNotification({
    id: NOTIFICATION_ID,
    title: 'Indexing Screenshots',
    body: progressText,
    android: {
      channelId: CHANNEL_ID,
      ongoing: true,
      ...(total ? { progress: { max: total, current: processed } } : { progress: { indeterminate: true } }),
      smallIcon: 'ic_launcher', // fallback to default app icon
    },
  });
}

export async function clearSyncNotification() {
  await notifee.cancelNotification(NOTIFICATION_ID);
}
