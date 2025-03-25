import { StyleSheet, TouchableOpacity, Alert, FlatList, View, Switch } from 'react-native';
import React, { useState, useEffect } from 'react';
import { deleteUser } from '../../../lib/client';
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

  const handleExportData = async () => {
    try {
      // Retrieve the stored email (adjust key if needed)
      const storedEmail = await AsyncStorage.getItem('email');
      if (!storedEmail) {
        Platform.OS === 'web'
          ? window.alert('Error: No email found')
          : Alert.alert('Error', 'No email found');
        return;
      }
      const response = await fetch(`http://localhost:3000/export/${storedEmail}`);
      if (!response.ok) {
        throw new Error('Error exporting data');
      }
      const exportData = await response.json();
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
    };
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

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
        </ScrollView>

        <TouchableOpacity style={styles.exportButton} onPress={handleExportData}>
          <ThemedText style={styles.exportButtonText}>Export My Data</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmUserDeletion}>
          <ThemedText style={styles.deleteButtonText}>Delete My Data</ThemedText>
        </TouchableOpacity>
      </View>
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
  exportButton: {
    backgroundColor: '#a39d41',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#e10812',
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#a39d41',
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
