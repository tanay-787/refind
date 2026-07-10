import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Linking, AppState, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';
import { SettingsAlertDialog } from '@/ui/SettingsAlertDialog';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ThemedHost } from '@/theme';

interface PermissionContextValue {
  hasMediaPermission: boolean | null; // null means checking
  hasNotificationPermission: boolean | null;
  isChecking: boolean;
  requestPermissions: () => Promise<{ media: boolean; notifications: boolean }>;
  requestNotificationPermission: () => Promise<boolean>;
  checkAndRequestNotificationPermission: () => Promise<boolean>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissionResponse, requestPermissionHook] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });

  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);
  const [showSettingsAlert, setShowSettingsAlert] = useState(false);
  const router = useRouter();

  const checkIsFullyGranted = (res: MediaLibrary.PermissionResponse | null) => {
    if (!res) return false;
    const rawRes = res as any;
    return res.granted && rawRes.accessPrivileges !== 'limited';
  };

  const checkNotifStatus = async () => {
    const settings = await notifee.getNotificationSettings();
    setHasNotificationPermission(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);
  };

  useEffect(() => {
    if (permissionResponse) {
      setHasMediaPermission(checkIsFullyGranted(permissionResponse));
    }
  }, [permissionResponse]);

  useEffect(() => {
    checkNotifStatus();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        const currentRes = await MediaLibrary.getPermissionsAsync();
        setHasMediaPermission(checkIsFullyGranted(currentRes));
        await checkNotifStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const notifSettings = await notifee.requestPermission();
      const granted = notifSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setHasNotificationPermission(granted);
      return granted;
    } catch (err) {
      console.warn("Notification request rejected or failed:", err);
      setHasNotificationPermission(false);
      return false;
    }
  };

  const checkAndRequestNotificationPermission = async () => {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.NOT_DETERMINED) {
      return await requestNotificationPermission();
    } else if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      await notifee.openNotificationSettings();
      return false;
    }
    return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
  };

  const requestPermissions = async () => {
    let mediaGranted = false;

    // Handle Media Permission
    if (permissionResponse && !checkIsFullyGranted(permissionResponse)) {
      const rawRes = permissionResponse as any;
      if (!rawRes.canAskAgain || rawRes.accessPrivileges === 'limited') {
        setShowSettingsAlert(true);
        return { media: false, notifications: hasNotificationPermission || false };
      }
    }

    const result = await requestPermissionHook();
    mediaGranted = checkIsFullyGranted(result);
    setHasMediaPermission(mediaGranted);

    let notifGranted = hasNotificationPermission || false;

    // If media was granted via standard prompt, ask sequentially
    if (mediaGranted) {
      notifGranted = await requestNotificationPermission();
    }

    return { media: mediaGranted, notifications: notifGranted };
  };

  const value = useMemo(() => ({
    hasMediaPermission,
    hasNotificationPermission,
    isChecking: permissionResponse === null || hasNotificationPermission === null,
    requestPermissions,
    requestNotificationPermission,
    checkAndRequestNotificationPermission,
  }), [hasMediaPermission, hasNotificationPermission, permissionResponse]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
      <SettingsAlertDialog 
        visible={showSettingsAlert} 
        onDismiss={() => setShowSettingsAlert(false)} 
        onConfirm={async () => {
          setShowSettingsAlert(false);
          Linking.openSettings();
          
          await SecureStore.setItemAsync('has_seen_onboarding', 'true');
          router.replace('/home');
        }}
      />
    </PermissionContext.Provider>
  );
}

export function usePermissionContext() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext must be used within a PermissionProvider');
  }
  return context;
}
