import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Linking, AppState } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';

interface PermissionContextValue {
  hasMediaPermission: boolean | null; // null means checking
  hasNotificationPermission: boolean | null;
  isChecking: boolean;
  requestPermissions: () => Promise<{ media: boolean; notifications: boolean }>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissionResponse, requestPermissionHook] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });

  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);

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

  const requestPermissions = async () => {
    let mediaGranted = false;

    // Handle Media Permission
    if (permissionResponse && !checkIsFullyGranted(permissionResponse)) {
      const rawRes = permissionResponse as any;
      if (!rawRes.canAskAgain || rawRes.accessPrivileges === 'limited') {
        Linking.openSettings();
        return { media: false, notifications: hasNotificationPermission || false };
      }
    }

    const result = await requestPermissionHook();
    mediaGranted = checkIsFullyGranted(result);
    setHasMediaPermission(mediaGranted);

    let notifGranted = hasNotificationPermission || false;

    // Handle Notification Permission if Media is granted
    if (mediaGranted) {
      const notifSettings = await notifee.requestPermission();
      notifGranted = notifSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
      setHasNotificationPermission(notifGranted);
    }

    return { media: mediaGranted, notifications: notifGranted };
  };

  const value = useMemo(() => ({
    hasMediaPermission,
    hasNotificationPermission,
    isChecking: permissionResponse === null || hasNotificationPermission === null,
    requestPermissions,
  }), [hasMediaPermission, hasNotificationPermission, permissionResponse]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
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
