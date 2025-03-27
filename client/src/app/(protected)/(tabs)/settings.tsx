import { StyleSheet, TouchableOpacity, Alert, FlatList, View, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import { deleteUser, exportUserData } from '../../../lib/client';
import { ThemedText } from '../../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useTheme } from '../../../components/ThemeContext';
import { Colors } from '../../../components/styles/Colors';
import { ScrollView } from 'react-native';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import { SettingsPageStyles} from '../../../components/styles/SettingsPageStyles';
import { enableNotifications, disableNotifications, getNotificationStatus } from '../../NotificationsHandler';

// Main Settings screen component
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

  // Toggles app notification settings – accessed by the Settings UI switch
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

  // Exports user data based on saved email
  const handleExportData = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      if (!storedEmail) {
        Platform.OS === 'web'
          ? window.alert('Error: No email found')
          : Alert.alert('Error', 'No email found');
        return;
      }
      const exportData = await exportUserData(storedEmail);

      if (Platform.OS === 'ios') {
        const fileUri = FileSystem.documentDirectory + 'exportData.json';
        await FileSystem.writeAsStringAsync(
          fileUri,
          JSON.stringify(exportData, null, 2),
          { encoding: FileSystem.EncodingType.UTF8 }
        );
        Alert.alert('Exported Data', `Data saved to ${fileUri}`);
      }
      else if (Platform.OS === 'web') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exportData.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        window.alert('Exported Data: Data downloaded as exportData.json');
      }
    }
    catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to export data');
      } else {
        Alert.alert('Failed to export data');
      }
    }
  };

  // Signs the user out – called by the "Sign Out" button and also after deleting a user
  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  // Deletes the user account
  const DeleteUser = async () => {
    console.log('Confirm Delete pressed');
    try {
      const storedEmail = await AsyncStorage.getItem('email');
      if (!storedEmail) {
        if (Platform.OS === 'web') {
          window.alert('Error: No email found');
        } else {
          Alert.alert('Error', 'No email found');
        }
        return;
      }
      console.log('Deleting user with email:', storedEmail);
      await deleteUser(storedEmail);
      if (Platform.OS === 'web') {
        window.alert('User Deleted – Your account has been removed successfully.');
      } else {
        Alert.alert('User Deleted', 'User has been deleted successfully.');
      }
      // Await sign-out to ensure token removal and navigation happen
      await handleSignOut();
    } catch (error: any) {
      console.error('Error in confirmDeleteUser:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Failed to delete user');
      } else {
        Alert.alert('Error', error.message || 'Failed to delete user');
      }
    }
  };

  // Triggers confirmation prompt and proceeds to delete user if confirmed
  const confirmUserDeletion = () => {
    console.log('Delete User pressed');
    if (Platform.OS === 'web') {
      console.log('Delete User pressed on Web');
      const confirmed = window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      );
      if (confirmed) {
        console.log('Delete confirmed on Web');
        DeleteUser();
      } else {
        console.log('Delete canceled on Web');
      }
    } else {
      Alert.alert(
        'Confirm Delete Account',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => console.log('Delete canceled') },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('Delete confirmed');
              DeleteUser();
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Renders individual setting option rows with icons and navigation links
  const renderItem = ({ item }: { item: { title: string; icon: any; route: RouteType } }) => (
    <TouchableOpacity style={SettingsPageStyles.settingItem} onPress={() => router.push(item.route)}>
      <View style={SettingsPageStyles.iconContainer}>
        <Image source={item.icon} style={[SettingsPageStyles.iconImage, { tintColor: Colors[theme].text }]} />
      </View>
      <ThemedText style={[SettingsPageStyles.settingText, { color: Colors[theme].text }]}>{item.title}</ThemedText>
      <Feather name="chevron-right" size={20} color={Colors[theme].text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors[theme].background }}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
            <ThemedText type="title" style={{ color: Colors[theme].text }}>Settings</ThemedText>
          </View>

          <FlatList
            data={settingsOptions}
            renderItem={renderItem}
            keyExtractor={(item) => item.title}
            contentContainerStyle={SettingsPageStyles.listContainer}
          />

          <View style={SettingsPageStyles.settingItem}>
            <View style={SettingsPageStyles.iconContainer}>
              <Image source={require('../../../../assets/images/appearance.png')} style={[SettingsPageStyles.iconImage, { tintColor: Colors[theme].text }]} />
            </View>
            <ThemedText style={[SettingsPageStyles.settingText, { color: Colors[theme].text }]}>Dark Mode</ThemedText>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
          </View>

          <View style={SettingsPageStyles.settingItem}>
            <View style={SettingsPageStyles.iconContainer}>
              <Image source={require('../../../../assets/images/notifications.png')} style={[SettingsPageStyles.iconImage, { tintColor: Colors[theme].text }]} />
            </View>
            <ThemedText style={[SettingsPageStyles.settingText, { color: Colors[theme].text }]}>Notifications</ThemedText>
            <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
          </View>
        </ScrollView>

        <TouchableOpacity style={SettingsPageStyles.exportButton} onPress={handleExportData}>
          <ThemedText style={SettingsPageStyles.exportButtonText}>Export My Data</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={SettingsPageStyles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={SettingsPageStyles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={SettingsPageStyles.deleteButton} onPress={confirmUserDeletion}>
          <ThemedText style={SettingsPageStyles.deleteButtonText}>Delete My Data/Account</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
