import React from 'react';
import { AlertDialog, TextButton, Text } from '@expo/ui/jetpack-compose';
import { useBrandColors } from '@/theme';
import * as SecureStore from 'expo-secure-store';
import { usePermissionContext } from '@/hooks';

interface NotificationPromptDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

export function NotificationPromptDialog({ visible, onDismiss }: NotificationPromptDialogProps) {
  const colors = useBrandColors();
  const { checkAndRequestNotificationPermission } = usePermissionContext();

  if (!visible) return null;

  const handleConfirm = async () => {
    onDismiss();
    await SecureStore.setItemAsync('has_seen_notif_prompt', 'true');
    await checkAndRequestNotificationPermission();
  };

  const handleDecline = async () => {
    onDismiss();
    await SecureStore.setItemAsync('has_seen_notif_prompt', 'true');
  };

  return (
    <AlertDialog
      onDismissRequest={handleDecline}
      colors={{
        containerColor: colors.surface,
        titleContentColor: colors.onSurface,
        textContentColor: colors.onSurfaceVariant,
      }}
    >
      <AlertDialog.Title>
        <Text color={colors.onSurface} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18 }}>
          Show Sync Status
        </Text>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Text color={colors.onSurfaceVariant} style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
          Refind processes your screenshots in the background. Would you like to be notified when this happens?
        </Text>
      </AlertDialog.Text>
      <AlertDialog.ConfirmButton>
        <TextButton onClick={handleConfirm}>
          <Text color={colors.primary} style={{ fontFamily: 'Inter_500Medium' }}>Turn on notifications</Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
      <AlertDialog.DismissButton>
        <TextButton onClick={handleDecline}>
          <Text color={colors.onSurfaceVariant} style={{ fontFamily: 'Inter_500Medium' }}>Not now</Text>
        </TextButton>
      </AlertDialog.DismissButton>
    </AlertDialog>
  );
}
