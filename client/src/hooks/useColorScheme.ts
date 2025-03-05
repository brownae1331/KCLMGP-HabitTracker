import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export function useColorScheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(Appearance.getColorScheme() || 'light');

  useEffect(() => {
    const loadThemePreference = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      } else {
        setTheme(Appearance.getColorScheme() || 'light');
      }
    };

    loadThemePreference();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme as 'light' | 'dark');
    });

    return () => subscription.remove();
  }, []);

  return theme;
}
