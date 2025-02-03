import { useEffect, useState } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useColorScheme() {
  const systemColorScheme = _useColorScheme();
  const [userTheme, setUserTheme] = useState<string | null>(null);

  useEffect(() => {
    const fetchTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setUserTheme(savedTheme);
      }
    };
    fetchTheme();
  }, []);

  return userTheme ?? systemColorScheme ?? 'light';
}
