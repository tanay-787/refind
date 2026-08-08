### Summary

When using `expo-router` with a modal route configured with `presentation: 'transparentModal'`, native custom views (specifically Jetpack Compose views via `@expo/ui/jetpack-compose` and `expo-image` using Glide) fail to re-render and become blank when the app resumes from the background on Android.

Standard React Native components (`View`, `Text`, `TouchableOpacity`) correctly recover, but `ExpoComposeView` and `ExpoImageView` do not.

### Environment

- **Expo SDK Version:** 56.0.11
- **@expo/ui Version:** 56.0.17
- **expo-image Version:** 56.0.11
- **expo-router Version:** 56.2.10
- **react-native-screens Version:** 4.25.2
- **react-native Version:** 0.85.3
- **Platform:** Android

### Steps to Reproduce

1. Create an `expo-router` stack and configure a route with `presentation: 'transparentModal'`.
2. Inside the modal screen, render an `Image` from `expo-image` and a Jetpack Compose view using `@expo/ui/jetpack-compose` (e.g., `<Host>`).
3. Navigate to this modal route.
4. Send the app to the background (e.g., trigger an Android Share Sheet, open MLKit/Camera intent, or press the Home button).
5. Return to the app.

### Expected Behavior

Both the `expo-image` and the `@expo/ui` Jetpack Compose views should render normally on the recreated hardware surface.

### Actual Behavior

The `expo-image` and Jetpack Compose views completely disappear/render blank (leaving a transparent hole in the UI). Only standard React Native views (like a TopBar built with standard `<View>`) remain visible.

### Root Cause Analysis (Deep Dive)

1. **Android Memory Management:** When the Android Activity goes to the background (`onStop()`), Android destroys the hardware drawing layer (SurfaceView) to save RAM.
2. **`react-native-screens` Behavior:** Under a `transparentModal`, `react-native-screens` purposefully does **not** detach the `ScreenFragment` from the window hierarchy, allowing the underlying background screens to remain attached and visible.
3. **Expo Lifecycle Hooks:** Because the view is never detached, Expo's window attach/detach lifecycle listeners (such as `OnAttachAfterDetachmentListener` introduced in `ExpoComposeView.kt`) **never fire** when the app resumes.
4. **The Glitch:** When the app comes back to the foreground, Android recreates the hardware drawing surface. Standard Android views redraw automatically. However, custom rendering pipelines (like Jetpack Compose's `RenderNode` and Glide's bitmap painting) need an explicit lifecycle signal (like `disposeComposition()`, `setContent()`, or a manual `invalidate()`) to rebuild their states onto the new surface.
5. **Result:** Since the views were never detached, they never receive a signal to repaint. The views sit attached to the React hierarchy but are completely blank.

### Proposed Fix Directions

**At the Native Level:**
1. **`react-native-screens`:** `ScreenFragment.kt` could manually traverse its view tree and trigger `.requestLayout()` or `.invalidate()` on `onResume()` for translucent fragments to explicitly wake up custom render nodes.
2. **Expo Modules (`@expo/ui` & `expo-image`):** Instead of relying strictly on `View.OnAttachStateChangeListener` which fails for transparent modals, these modules should attach a `LifecycleEventObserver` to the host Activity. When `ON_RESUME` fires, they can explicitly dispose/recreate their compositions and redraw their bitmaps if the surface was lost.