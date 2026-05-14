import { Modal, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { Image } from 'expo-image';
import Gallery from 'react-native-awesome-gallery';
import { Appbar } from 'react-native-paper';

import type { ScreenshotAsset } from '../types';

function GalleryFrame({
  item,
  setImageDimensions,
}: {
  item: ScreenshotAsset;
  setImageDimensions: (dimensions: { width: number; height: number }) => void;
}) {
  useEffect(() => {
    setImageDimensions({ width: item.width || 1, height: item.height || 1 });
  }, [item.height, item.width, setImageDimensions]);

  return (
    <View style={styles.viewerStage}>
      <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
    </View>
  );
}

type Props = {
  activeIndex: number;
  assets: ScreenshotAsset[];
  onClose: () => void;
  onIndexChange: (index: number) => void;
  visible: boolean;
};

export function ScreenshotViewer({ activeIndex, assets, onClose, onIndexChange, visible }: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.viewerShell}>
        <Appbar.Header mode="small" style={styles.viewerHeader}>
          <Appbar.BackAction onPress={onClose} color="#fff" />
          <Appbar.Content
            title={assets[activeIndex]?.filename ?? 'Screenshot'}
            subtitle={`${activeIndex + 1}/${Math.max(assets.length, 1)}`}
            color="#fff"
          />
        </Appbar.Header>

        <View style={styles.viewerGallery}>
          {visible && assets.length > 0 && (
            <Gallery
              data={assets}
              initialIndex={activeIndex}
              onIndexChange={onIndexChange}
              renderItem={({ item, setImageDimensions }) => (
                <GalleryFrame item={item} setImageDimensions={setImageDimensions} />
              )}
              keyExtractor={(item) => item.id}
              loop={assets.length > 1}
              swipeEnabled
              pinchEnabled
              disableVerticalSwipe={false}
              style={styles.viewerGallery}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerShell: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    backgroundColor: '#000',
  },
  viewerGallery: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
