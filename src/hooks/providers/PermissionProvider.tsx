import React, { createContext, useContext, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

interface PermissionContextValue {
  hasPermission: boolean | null; // null means checking, boolean is status
  isChecking: boolean;
  requestPermission: () => Promise<boolean>;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissionResponse, requestPermissionHook] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  });

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const checkIsFullyGranted = (res: MediaLibrary.PermissionResponse | null) => {
    if (!res) return false;
    
    // In recent Expo SDKs, the generic PermissionResponse type omits 'accessPrivileges', 
    // but the native iOS and Android modules still return it. We cast to 'any' to bypass the TS error.
    const rawRes = res as any;
    
    // We strictly require 'all' access. If it's 'limited' (iOS 14+ and Android 14+ Selected Photos Access), 
    // it's insufficient for background indexing.
    return res.granted && rawRes.accessPrivileges !== 'limited';
  };

  useEffect(() => {
    console.log('[PermissionProvider] permissionResponse changed:', permissionResponse);
    if (permissionResponse) {
      setHasPermission(checkIsFullyGranted(permissionResponse));
    }
  }, [permissionResponse]);

  const requestPermission = async () => {
    // If the OS won't let us prompt again (because they previously denied or selected limited),
    // or if they are in 'limited' state on iOS, we must route them to Settings to fix it.
    if (permissionResponse && !checkIsFullyGranted(permissionResponse)) {
      const rawRes = permissionResponse as any;
      // If we can't ask again, or if it's explicitly limited (which often blocks the native prompt from upgrading)
      if (!rawRes.canAskAgain || rawRes.accessPrivileges === 'limited') {
        Linking.openSettings();
        return false;
      }
    }

    const result = await requestPermissionHook();
    const isFullyGranted = checkIsFullyGranted(result);
    setHasPermission(isFullyGranted);
    return isFullyGranted;
  };

  const value = React.useMemo(() => ({
    hasPermission,
    isChecking: permissionResponse === null,
    requestPermission,
  }), [hasPermission, permissionResponse, requestPermissionHook]);

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
