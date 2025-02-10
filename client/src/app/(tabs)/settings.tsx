import { StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeContext';
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'




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
  
  const handleSignOut = async () => {
    try {
      // Remove authentication token from AsyncStorage
      await AsyncStorage.removeItem('token');

      // Go to log in page
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  

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

        <ThemedView style={styles.settingItem}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  signOutButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'none',
  },
});
