import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useThemeColor } from 'heroui-native/hooks';

const TAB_ITEMS = [
  {
    name: 'home',
    label: 'Search',
    icon: {
      sf: 'magnifyingglass',
      md: 'search',
    },
  },
  {
    name: 'library',
    label: 'Library',
    icon: {
      sf: 'books.vertical',
      md: 'book',
    },
  },
] as const;

export default function TabsLayout() {
  const [background, foreground, muted, accent, accentForeground, border] = useThemeColor([
    'background',
    'foreground',
    'default-foreground',
    'accent',
    'accent-foreground',
    'border-secondary',
  ] as const);

  return (
    <NativeTabs
      badgeBackgroundColor={accent}
      badgeTextColor={accentForeground}
      disableTransparentOnScrollEdge
      iconColor={{ default: muted, selected: accentForeground }}
      indicatorColor={accent}
      labelStyle={{
        default: {
          color: foreground,
        },
        selected: {
          color: accent,
        },
      }}
      shadowColor={border}
    >
      {TAB_ITEMS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon md={tab.icon.md} sf={tab.icon.sf} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
