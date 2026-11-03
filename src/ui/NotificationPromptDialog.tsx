import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme';
import * as SecureStore from 'expo-secure-store';
import { usePermissionContext } from '@/hooks';

interface NotificationPromptDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

export function NotificationPromptDialog({ visible, onDismiss }: NotificationPromptDialogProps) {
  const colors = useThemeColors();
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
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDecline} />
        
        <View 
          style={[
            styles.card, 
            { backgroundColor: colors.surfaceContainerHigh }
          ]}
        >
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Show Sync Status
          </Text>

          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            Refind processes your screenshots in the background. Would you like to be notified when this happens?
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={handleDecline}
              android_ripple={{ color: colors.surfaceVariant, borderless: false }}
              style={styles.button}
            >
              <Text style={[styles.buttonText, { color: colors.onSurfaceVariant }]}>
                Not now
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              android_ripple={{ color: colors.primaryContainer, borderless: false }}
              style={styles.button}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Turn on notifications
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 28,
    padding: 24,
    elevation: 6,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    marginBottom: 12,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
