import { StyleSheet, TouchableOpacity, Alert, FlatList, View } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons'
import { Image } from 'react-native';
import { useTheme } from '../../components/ThemeContext';
import { Colors } from '../../components/styles/Colors';
import { ScrollView } from 'react-native';
import { SharedStyles } from '../../components/styles/SharedStyles';

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

const settingsOptions = [
  { title: 'Account', icon: require('../../../assets/images/account.png'), route: '/account' as const },
  { title: 'Notifications', icon: require('../../../assets/images/notifications.png'), route: '/notifications' as const },
  { title: 'Appearance', icon: require('../../../assets/images/appearance.png'), route: '/appearance' as const },
] as const;

type RouteType = (typeof settingsOptions)[number]['route'];

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const renderItem = ({ item }: { item: { title: string; icon: any; route: RouteType } }) => (
    <TouchableOpacity style={styles.settingItem} onPress={() => router.push(item.route)}>
      <View style={styles.iconContainer}>
        <Image source={item.icon} style={styles.iconImage} />
      </View>
      <ThemedText style={styles.settingText}>{item.title}</ThemedText>
      <Feather name="chevron-right" size={20} color="gray" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>Settings</ThemedText>
        </View>

        <FlatList
          data={settingsOptions}
          renderItem={renderItem}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.listContainer}
        />

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  listContainer: {
    flexGrow: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: 'black',
  },
  signOutButton: {
    backgroundColor: 'red',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    backgroundColor: 'transparent',
  },
});