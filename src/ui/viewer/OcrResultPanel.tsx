import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ScrollView, Dimensions } from 'react-native';
import { SymbolView } from 'expo-symbols';
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
    <View style={[styles.textPanel, { paddingBottom: Math.max(insets.bottom, 24) }]}>
      <View style={styles.textPanelHeader}>
        <Text style={styles.textPanelTitle}>Extracted Text</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={24} tintColor="#rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.textScrollView}>
        <Text selectable style={styles.extractedText}>{text}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  textPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 300,
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
