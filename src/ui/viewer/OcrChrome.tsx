import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner } from 'heroui-native';
import { IconView } from '@/ui/IconView';

interface ViewerOcrChromeProps {
  onCancel: () => void;
  onScan: () => void;
  isScanning: boolean;
}

export function ViewerOcrChrome({ onCancel, onScan, isScanning }: ViewerOcrChromeProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(180)}
        style={[styles.topBar, { paddingTop: Math.max(insets.top, 16), zIndex: 200 }]}
      >
        <TouchableOpacity 
          onPress={onCancel} 
          style={styles.cancelBtn}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Adjust Selection</Text>
        <View style={styles.cancelBtn} pointerEvents="none" />
      </Animated.View>
      
      <Animated.View 
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(180)}
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24), zIndex: 200 }]}
      >
        <Button
          size="lg"
          variant="primary"
          isDisabled={isScanning}
          onPress={onScan}
          className="rounded-full px-8 py-3.5 flex-row items-center justify-center gap-2.5 bg-white"
          style={styles.scanBtn}
        >
          {isScanning ? (
            <>
              <Spinner size="sm" color="#000000" />
              <Button.Label style={styles.scanBtnText}>Scanning...</Button.Label>
            </>
          ) : (
            <>
              <IconView name="scan" size={20} tintColor="#000000" />
              <Button.Label style={styles.scanBtnText}>Scan Selection</Button.Label>
            </>
          )}
        </Button>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  cancelBtn: {
    minWidth: 70,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
    color: '#ffffff',
    fontSize: 15,
  },
  scanBtn: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  scanBtnText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000000',
    fontSize: 15,
  },
});
