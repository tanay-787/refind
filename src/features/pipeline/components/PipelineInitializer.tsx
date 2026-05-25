import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Directory, Paths } from 'expo-file-system';
import {
  initializePipelineDatabase,
  registerBackgroundTasks,
  scheduleBackgroundTasks,
  initializeSiglipModels,
} from '../index';

export function PipelineInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Create app directories if needed
        const modelsDir = new Directory(Paths.document, 'models');
        if (!modelsDir.exists) {
          await modelsDir.create({ intermediates: true });
        }
        const cacheDir = new Directory(Paths.document, 'cache');
        if (!cacheDir.exists) {
          await cacheDir.create({ intermediates: true });
        }

        // Initialize pipeline database
        await initializePipelineDatabase();

        const visionUrl = process.env.EXPO_PUBLIC_SIGLIP_VISION_URL;
        const textUrl = process.env.EXPO_PUBLIC_SIGLIP_TEXT_URL;
        const tokenizerUrl = process.env.EXPO_PUBLIC_SIGLIP_TOKENIZER_URL;
        if (visionUrl && textUrl && tokenizerUrl) {
          await initializeSiglipModels(visionUrl, textUrl, tokenizerUrl);
        }

        // Register background tasks
        await registerBackgroundTasks();

        // Schedule background tasks
        await scheduleBackgroundTasks();

        setInitialized(true);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Initialization failed';
        console.error('Pipeline initialization error:', cause);
        setError(message);
      }
    };

    initialize();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {error ? (
          <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', paddingHorizontal: 20 }}>
            Pipeline initialization failed: {error}
          </Text>
        ) : (
          <>
            <ActivityIndicator size="large" color="#2c3e50" />
            <Text style={{ marginTop: 16, color: '#666' }}>Initializing pipeline...</Text>
          </>
        )}
      </View>
    );
  }

  return <>{children}</>;
}
