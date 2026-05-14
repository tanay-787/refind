import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenshotGrid } from '../components/ScreenshotGrid';
import { ScreenshotPermissionState } from '../components/ScreenshotPermissionState';
import { ScreenshotViewer } from '../components/ScreenshotViewer';
import { useScreenshotFilters } from '../hooks/useScreenshotFilters';
import { useScreenshotLibrary } from '../hooks/useScreenshotLibrary';
import { useScreenshotViewer } from '../hooks/useScreenshotViewer';

export default function ScreenshotBrowserScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { assets, error, loading, granted, denied, requestAccess, refresh } = useScreenshotLibrary();
  const { timeFilter, setTimeFilter, timeFilters, visibleAssets } = useScreenshotFilters(assets);
  const { activeIndex, openViewer, closeViewer, setActiveIndex, viewerVisible } =
    useScreenshotViewer(visibleAssets.length);

  const columns = width >= 900 ? 5 : width >= 720 ? 4 : width >= 520 ? 3 : 2;

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header mode="small" elevated={false} style={styles.header}>
        <Appbar.BackAction onPress={() => undefined} />
        <Appbar.Content title="Screenshots" subtitle={`${visibleAssets.length} items`} />
        <Appbar.Action icon="filter-variant" onPress={() => undefined} />
        <Appbar.Action icon="dots-vertical" onPress={() => undefined} />
      </Appbar.Header>

      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        {Platform.OS === 'web' ? (
          <View style={styles.infoState}>
            <Text variant="titleMedium">Screenshot access is unavailable on web</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
              Build and run this app on Android or iOS to request photo access and load your
              screenshots.
            </Text>
          </View>
        ) : !granted ? (
          <View style={[styles.permissionShell, { backgroundColor: theme.colors.surface }]}>
            <ScreenshotPermissionState denied={denied} onGrantAccess={requestAccess} />
          </View>
        ) : (
          <ScreenshotGrid
            assets={visibleAssets}
            columns={columns}
            error={error}
            loading={loading}
            subtitleCount={assets.length}
            timeFilter={timeFilter}
            timeFilters={timeFilters}
            onOpenItem={openViewer}
            onRefresh={refresh}
            onSetTimeFilter={setTimeFilter}
          />
        )}
      </SafeAreaView>

      <ScreenshotViewer
        activeIndex={activeIndex}
        assets={visibleAssets}
        onClose={closeViewer}
        onIndexChange={setActiveIndex}
        visible={viewerVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent',
  },
  permissionShell: {
    margin: 16,
    padding: 20,
    gap: 16,
    borderRadius: 20,
  },
  infoState: {
    margin: 16,
    paddingTop: 8,
  },
});
