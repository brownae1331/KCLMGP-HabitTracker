/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '../components/styles/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeColors = keyof typeof Colors['light'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColors
) {
  const theme = useColorScheme();
  const colorFromTheme = Colors[theme][colorName];

  return props[theme] ?? colorFromTheme;
}
