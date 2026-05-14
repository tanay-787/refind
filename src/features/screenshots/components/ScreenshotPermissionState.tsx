import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

type Props = {
  denied: boolean;
  onGrantAccess: () => void;
};

export function ScreenshotPermissionState({ denied, onGrantAccess }: Props) {
  const theme = useTheme();

  return (
    <View>
      <Text variant="headlineSmall">Allow access to screenshots</Text>
      <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
        We scan the device&apos;s screenshot albums and common storage locations such as
        Pictures/Screenshots to show your screenshots in a gallery. Everything stays on-device.
      </Text>

      <Button mode="contained" icon="shield-lock" onPress={onGrantAccess} style={{ marginTop: 16 }}>
        Grant screenshot access
      </Button>

      {denied && (
        <Text style={{ marginTop: 16, color: theme.colors.error }}>
          Permission denied. Open app settings to allow access later.
        </Text>
      )}
    </View>
  );
}
