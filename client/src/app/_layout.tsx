import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '../components/ThemeContext'


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  // const colorScheme = useColorScheme();
  // const [theme] = useState<'light' | 'dark'>('light');
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // useEffect(() =>{
  //   const loadThemePreference = async () =>{
  //     const savedTheme = await AsyncStorage.getItem('theme');
  //     if (savedTheme) {
  //       setTheme(savedTheme as 'dark' | 'light');
  //     };
  //   };
  //   loadThemePreference();
  // },[]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, refreshKey } = useTheme();

  return (
    <NavigationThemeProvider key={refreshKey} value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack key={refreshKey}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
};