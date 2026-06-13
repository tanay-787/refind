import { useEffect, useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/theme';

type PermissionPrimerProps = {
  visible: boolean;
  onDismiss: () => void;
  onGranted: () => void;
};

export default function PermissionPrimer({ visible, onDismiss, onGranted }: PermissionPrimerProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    (async () => {
      const current = await MediaLibrary.getPermissionsAsync();
      if (!cancelled && current.granted) {
        onGranted();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onGranted, visible]);

  async function handleContinue() {
    setLoading(true);
    const result = await MediaLibrary.requestPermissionsAsync();
    setLoading(false);

    if (result.granted) {
      onGranted();
      return;
    }

    onDismiss();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.outline }]}>
          <Text style={[styles.title, { color: theme.text }]}>Find anything you've seen before</Text>
          <Text style={[styles.content, { color: theme.text }]}>
            SS-Search builds a private library from your screenshots so you can search them later, even offline.
          </Text>
          <Text style={[styles.content, { color: theme.outline }]}>
            We need photo access to read screenshots on device. Your files stay local.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onDismiss} disabled={loading}>
              <Text style={{ color: theme.text }}>Not now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleContinue} 
              disabled={loading} 
              style={[styles.button, { backgroundColor: theme.primary }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff' }}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dialog: {
    width: '80%',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 16,
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
});
