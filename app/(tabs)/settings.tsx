import { StyleSheet, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from 'react-native';
// import { DarkTheme } from '@react-navigation/native';
import { useTheme } from '@/components/ThemeContext';

// export default function SettingsScreen() {
//   const systemColorScheme = useColorScheme();
//   const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark')

//   useEffect(()=>{
//     const loadThemePreference = async () =>{
//       const savedTheme = await AsyncStorage.getItem('theme');
//       if (savedTheme) {
//         setIsDarkMode(savedTheme === 'dark');
//       }
//     };

//     loadThemePreference();
//   },[]);

//   const toggleswith = async () => {
//     const newTheme = isDarkMode? 'light' :'dark';
//     setIsDarkMode(!isDarkMode);
//     await AsyncStorage.setItem('theme', newTheme);
//   };

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <ScrollView style={{ flex: 1 }}>  
//         <ThemedView style={styles.titleContainer}>
//           <ThemedText type="title">Settings</ThemedText>
//         </ThemedView>

//         <ThemedView style={styles.settingItem}>
//           <ThemedText>Dark Mode</ThemedText>
//           <Switch value={isDarkMode} onValueChange={toggleswith} />
//         </ThemedView>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>

        <ThemedView style={styles.settingItem}>
          <ThemedText>Dark Mode</ThemedText>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  settingItem:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  }
});
