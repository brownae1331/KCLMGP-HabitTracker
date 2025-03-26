import { Text, type TextProps, StyleSheet } from 'react-native';

import { useThemeColor } from '../hooks/useThemeColor';
import { ThemedTextStyles } from './styles/ThemedTextStyles';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

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

