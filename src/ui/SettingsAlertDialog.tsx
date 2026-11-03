import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '@/theme';

interface SettingsAlertDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function SettingsAlertDialog({ visible, onDismiss, onConfirm }: SettingsAlertDialogProps) {
  const colors = useThemeColors();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <View 
          style={[
            styles.card, 
            { backgroundColor: colors.surfaceContainerHigh }
          ]}
        >
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Photo Access Required
          </Text>

          <Text style={[styles.message, { color: colors.onSurfaceVariant }]}>
            Refind needs &apos;Allow All&apos; photo access to search your screenshots. Please enable this in your device settings.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onDismiss}
              android_ripple={{ color: colors.surfaceVariant, borderless: false }}
              style={styles.button}
            >
              <Text style={[styles.buttonText, { color: colors.onSurfaceVariant }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              android_ripple={{ color: colors.primaryContainer, borderless: false }}
              style={styles.button}
            >
              <Text style={[styles.buttonText, { color: colors.primary }]}>
                Open Settings
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
