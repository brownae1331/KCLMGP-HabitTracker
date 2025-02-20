import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserDetails, updateUserDetails } from '../lib/client';

export default function AccountScreen() {
  const { theme } = useTheme();

  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  // Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getUserDetails();
        setUserName(user.username);
        setEmail(user.email);
      } catch (error) {
        console.error('Failed to load user data', error);
      }
    };

    loadUserData();
  }, []);

  const handleNameChange = async (text: string) => {
    setUserName(text);
    await updateUserDetails({ username: text });
    Alert.alert('Success', 'Your username has been updated.');
  };

  const handleEmailChange = async () => {
    setIsEditingEmail(false);
    await updateUserDetails({ email });
    Alert.alert('Success', 'Your email has been updated.');
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    try {
      await updateUserDetails({ oldPassword, newPassword });
      setIsPasswordModalVisible(false);
      Alert.alert('Success', 'Your password has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ThemedView style={[styles.section, { backgroundColor: Colors[theme].background }]}>
        <ThemedText type="title" style={[styles.headerText, { color: Colors[theme].text }]}>
          Account Settings
        </ThemedText>
      </ThemedView>

      {/* Username Field */}
      <ThemedView style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Your Name</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[theme].text,
              borderColor: Colors[theme].border,
              backgroundColor: theme === 'dark' ? '#222' : '#FFF', 
            },
          ]}
          value={userName}
          onChangeText={setUserName}
          placeholderTextColor={Colors[theme].placeholder}
        />
      </ThemedView>

      {/* Email Field with Change Button */}
      <ThemedView style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Email Address</ThemedText>
        {isEditingEmail ? (
          <TextInput
            style={[
              styles.input,
              {
                color: Colors[theme].text,
                borderColor: Colors[theme].border,
                backgroundColor: theme === 'dark' ? '#222' : '#FFF', 
              },
            ]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholderTextColor={Colors[theme].placeholder}
          />
        ) : (
          <ThemedText style={{ color: Colors[theme].text }}>{email}</ThemedText>
        )}
        <TouchableOpacity onPress={() => (isEditingEmail ? handleEmailChange() : setIsEditingEmail(true))}>
          <ThemedText style={[styles.changeText, { color: theme === 'dark' ? '#3399FF' : 'blue' }]}>
            {isEditingEmail ? 'Save' : 'Change'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Password Section with Change Button */}
      <ThemedView style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Password</ThemedText>
        <ThemedText style={{ color: Colors[theme].text }}>********</ThemedText>
        <TouchableOpacity onPress={() => setIsPasswordModalVisible(true)}>
          <ThemedText style={[styles.changeText, { color: theme === 'dark' ? '#3399FF' : 'blue' }]}>
            Change
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  changeText: {
    marginTop: 5,
  },
});
