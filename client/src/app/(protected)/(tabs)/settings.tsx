import { StyleSheet, TouchableOpacity, Alert, FlatList, View, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import { ThemedText } from '../../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useTheme } from '../../../components/ThemeContext';
import { Colors } from '../../../components/styles/Colors';
import { ScrollView } from 'react-native';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import { enableNotifications, disableNotifications, getNotificationStatus } from '../../NotificationsHandler';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    async function fetchNotificationStatus() {
      const status = await getNotificationStatus();
      setNotificationsEnabled(status);
    }
    fetchNotificationStatus();
  }, []);

  const toggleNotifications = async () => {
    console.log('Toggle function called on web!');

    try {
      let newState = !notificationsEnabled;
      setNotificationsEnabled(newState);

      if (newState) {
        console.log('Enabling notifications...');
        await enableNotifications();
      } else {
        console.log('Disabling notifications...');
        await disableNotifications();
      }

    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings.');
    }
  };



  const settingsOptions = [
    { title: 'Account', icon: require('../../../../assets/images/account.png'), route: '/account' as const },
  ] as const;

  type RouteType = (typeof settingsOptions)[number]['route'];

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
        <Image source={item.icon} style={[styles.iconImage, { tintColor: Colors[theme].text }]} />
      </View>
      <ThemedText style={[styles.settingText, { color: Colors[theme].text }]}>{item.title}</ThemedText>
      <Feather name="chevron-right" size={20} color={Colors[theme].text} />
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

        <View style={styles.settingItem}>
          <View style={styles.iconContainer}>
            <Image source={require('../../../../assets/images/appearance.png')} style={[styles.iconImage, { tintColor: Colors[theme].text }]} />
          </View>
          <ThemedText style={[styles.settingText, { color: Colors[theme].text }]}>Dark Mode</ThemedText>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.iconContainer}>
            <Image source={require('../../../../assets/images/notifications.png')} style={[styles.iconImage, { tintColor: Colors[theme].text }]} />
          </View>
          <ThemedText style={[styles.settingText, { color: Colors[theme].text }]}>Notifications</ThemedText>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

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
