import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewerOcrChromeProps {
  onCancel: () => void;
  onScan: () => void;
  isScanning: boolean;
}

export function ViewerOcrChrome({ onCancel, onScan, isScanning }: ViewerOcrChromeProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Animated.View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16), zIndex: 200 }]}>
        <TouchableOpacity onPress={onCancel} style={[styles.iconButton, { width: 80 }]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Adjust Crop</Text>
        <View style={[styles.iconButton, { width: 80 }]} pointerEvents="none" />
      </Animated.View>
      
      <Animated.View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24), justifyContent: 'center', zIndex: 200 }]}>
         <TouchableOpacity 
           onPress={onScan}
           disabled={isScanning}
           style={[styles.scanButton, { opacity: isScanning ? 0.7 : 1 }]}
         >
           <Text style={styles.scanButtonText}>
             {isScanning ? 'Scanning...' : 'Scan Text'}
           </Text>
         </TouchableOpacity>
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
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  iconButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.3,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  scanButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
