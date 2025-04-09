import { Colors } from '../components/styles/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeColors = keyof typeof Colors['light'];

// Returns the correct color based on the current theme ('light' or 'dark')
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColors
) {
  const theme = useColorScheme();
  const colorFromTheme = Colors[theme][colorName];

  return props[theme] ?? colorFromTheme;
}
