import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeContext'

// Background component for the bottom tab bar using a BlurView that adapts to the current theme
export default function BlurTabBarBackground() {
  const { theme } = useTheme();

  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint={theme === 'dark' ? 'dark' : 'light'}
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

// Calculates safe area overflow below the bottom tab bar for proper content spacing
export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}
