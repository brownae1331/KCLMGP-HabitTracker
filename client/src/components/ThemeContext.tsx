import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

// Defines the structure for theme context, including current theme, a toggle function, and a refresh key
interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  refreshKey: number;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Provides theme context to the app, including toggle and persistence via AsyncStorage
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [refreshKey, setRefreshKey] = useState<number>(0)

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
    setRefreshKey((prevKey) => prevKey + 1);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, refreshKey }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to access the current theme context values
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
