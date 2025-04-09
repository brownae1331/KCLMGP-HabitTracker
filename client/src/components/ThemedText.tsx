import { Text, type TextProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedTextStyles } from './styles/ThemedTextStyles';

// Props for ThemedText component, extending TextProps with support for light/dark theme overrides and custom text types
export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

// A reusable text component that applies theme-based color and predefined styles (e.g. title, subtitle)
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? ThemedTextStyles.default : undefined,
        type === 'title' ? ThemedTextStyles.title : undefined,
        type === 'defaultSemiBold' ? ThemedTextStyles.defaultSemiBold : undefined,
        type === 'subtitle' ? ThemedTextStyles.subtitle : undefined,
        type === 'link' ? ThemedTextStyles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

