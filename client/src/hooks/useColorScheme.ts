import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

// Custom hook that returns the current color scheme ('light' or 'dark'), based on user preference or system setting
export function useColorScheme() {
  const initialTheme: 'light' | 'dark' =
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);

  useEffect(() => {
    const loadThemePreference = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
      } else {
        setTheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
      }
    };

    loadThemePreference();

    const subscription = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
        // Explicitly fall back to 'light' if colorScheme is null or not 'dark'/'light'
        setTheme((colorScheme === 'dark' || colorScheme === 'light') ? colorScheme : 'light');
      }
    );

    return () => subscription.remove();
  }, []);

  return theme;
}
