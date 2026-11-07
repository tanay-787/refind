import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet, Button } from 'heroui-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { IconView } from '@/ui/IconView';
import { useThemeColors } from '@/theme';

interface ViewerOcrResultPanelProps {
  text: string | null;
  onClose: () => void;
}

export function ViewerOcrResultPanel({ text, onClose }: ViewerOcrResultPanelProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors({ colorScheme: 'dark' });
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const isCopied = Boolean(text && copiedText === text);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedText(text);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  }, [text]);

  return (
    <BottomSheet
      isOpen={Boolean(text)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={['45%', '85%']}
          enableOverDrag={false}
          enableDynamicSizing={false}
          backgroundClassName="rounded-t-[28px]"
          backgroundStyle={{ backgroundColor: '#18181B' }}
          contentContainerClassName="h-full px-5 pt-1 pb-6 gap-3"
          contentContainerProps={{
            style: {
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          }}
        >
          {/* Header Row: Title on Left, Copy Button on Right */}
          <View style={styles.headerRow}>
            <BottomSheet.Title style={[styles.title, { color: colors.onSurface }]}>
              Extracted Text
            </BottomSheet.Title>
            
            <Button
              size="sm"
              variant={isCopied ? 'secondary' : 'primary'}
              onPress={handleCopy}
              className="rounded-full px-3.5 py-1.5 flex-row items-center gap-1.5"
              style={isCopied ? styles.copiedBtn : styles.copyBtn}
              accessibilityLabel={isCopied ? 'Text copied' : 'Copy extracted text'}
            >
              <IconView 
                name={isCopied ? 'check' : 'content_copy'} 
                size={14} 
                weight="medium"
                tintColor={isCopied ? colors.primary : '#000000'} 
              />
              <Button.Label 
                style={[
                  styles.copyBtnText, 
                  { color: isCopied ? colors.primary : '#000000' }
                ]}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Button.Label>
            </Button>
          </View>

          {/* Scrollable Extracted Text */}
          <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text selectable style={[styles.extractedText, { color: colors.onSurface }]}>
              {text}
            </Text>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  title: {
    fontFamily: 'Newsreader_600SemiBold',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  copyBtn: {
    backgroundColor: '#ffffff',
  },
  copiedBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  copyBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  scrollView: {
    flex: 1,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  extractedText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    lineHeight: 22,
  },
});
