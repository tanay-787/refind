import React from 'react';
import { Linking } from 'react-native';
import { AlertDialog, TextButton, Text } from '@expo/ui/jetpack-compose';
import { useBrandColors } from '@/theme';

interface SettingsAlertDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function SettingsAlertDialog({ visible, onDismiss, onConfirm }: SettingsAlertDialogProps) {
  const colors = useBrandColors();

  if (!visible) return null;

  return (
    <AlertDialog
      onDismissRequest={onDismiss}
      colors={{
        containerColor: colors.surface,
        titleContentColor: colors.onSurface,
        textContentColor: colors.onSurfaceVariant,
      }}
    >
      <AlertDialog.Title>
        <Text color={colors.onSurface} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 18 }}>
          Photo Access Required
        </Text>
      </AlertDialog.Title>
      <AlertDialog.Text>
        <Text color={colors.onSurfaceVariant} style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
          Refind needs 'Allow All' photo access to search your screenshots. Please enable this in your device settings.
        </Text>
      </AlertDialog.Text>
      <AlertDialog.ConfirmButton>
        <TextButton onClick={onConfirm}>
          <Text color={colors.primary} style={{ fontFamily: 'Inter_500Medium' }}>Open Settings</Text>
        </TextButton>
      </AlertDialog.ConfirmButton>
      <AlertDialog.DismissButton>
        <TextButton onClick={onDismiss}>
          <Text color={colors.onSurfaceVariant} style={{ fontFamily: 'Inter_500Medium' }}>Cancel</Text>
        </TextButton>
      </AlertDialog.DismissButton>
    </AlertDialog>
  );
}
