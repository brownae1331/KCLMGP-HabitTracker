import { Switch, TouchableOpacity, Alert } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../components/ThemeContext';
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SettingsPageStyles } from '../../components/styles/SettingsPageStyle';



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
        <ThemedView style={SettingsPageStyles.titleContainer}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>

        <ThemedView style={SettingsPageStyles.settingItem}>
          <ThemedText>Dark Mode</ThemedText>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </ThemedView>

        <ThemedView style={SettingsPageStyles.settingItem}>
          <TouchableOpacity style={SettingsPageStyles.signOutButton} onPress={handleSignOut}>
            <ThemedText style={SettingsPageStyles.signOutText}>Sign Out</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
