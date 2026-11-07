import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ScrollView, Dimensions } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { IconView } from '@/ui/IconView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ViewerOcrResultPanelProps {
  text: string | null;
  onClose: () => void;
}

export function ViewerOcrResultPanel({ text, onClose }: ViewerOcrResultPanelProps) {
  const insets = useSafeAreaInsets();

  if (!text) return null;

  return (
    <Animated.View 
      entering={SlideInDown.springify().damping(22).stiffness(200)}
      exiting={SlideOutDown.duration(200)}
      style={[styles.textPanel, { paddingBottom: Math.max(insets.bottom, 24) }]}
    >
      {/* Handle notch */}
      <View style={styles.handle} />

      <View style={styles.textPanelHeader}>
        <Text style={styles.textPanelTitle}>Extracted Text</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconView name="cancel" size={24} tintColor="rgba(255, 255, 255, 0.6)" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.textScrollView} showsVerticalScrollIndicator>
        <Text selectable style={styles.extractedText}>{text}</Text>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  textPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.42,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 300,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  textPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textPanelTitle: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 20,
    color: '#fff',
  },
  closeBtn: {
    padding: 4,
  },
  textScrollView: {
    flex: 1,
  },
  extractedText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
  },
});
