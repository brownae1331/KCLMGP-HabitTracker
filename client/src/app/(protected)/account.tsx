import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Modal, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../../components/ThemedText';
import { useTheme } from '../../components/ThemeContext';
import { Colors } from '../../components/styles/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserDetails, updatePassword } from '../../lib/client';

export default function AccountScreen() {
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedEmail = await AsyncStorage.getItem('email');

        if (storedUsername) {
          setUsername(storedUsername);
        }
        if (storedEmail) {
          setEmail(storedEmail);
        } else if (storedUsername) {
          const userDetails = await getUserDetails(storedUsername);
          setEmail(userDetails.email);
          await AsyncStorage.setItem('email', userDetails.email);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await updatePassword(username, oldPassword, newPassword);

      Alert.alert('Success', 'Password updated successfully');
      setSuccessMessage('Password change successful');

      setModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error updating password');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <View style={[styles.section, { backgroundColor: Colors[theme].background }]}>
        <ThemedText type="title" style={[styles.headerText, { color: Colors[theme].text }]}>Account Information</ThemedText>
        {successMessage ? (
          <Text style={{ color: 'green', marginTop: 5 }}>{successMessage}</Text>
        ) : null}
      </View>

      {/* Username Field */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Username</ThemedText>
        <TextInput style={[styles.input, { color: Colors[theme].text }]} value={username} editable={false} />
      </View>

      {/* Email Field */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Email Address</ThemedText>
        <TextInput style={[styles.input, { color: Colors[theme].text }]} value={email} editable={false} />
      </View>

      {/* Password Field */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Password</ThemedText>
        <TextInput style={[styles.input, { color: Colors[theme].text }]} value="******" editable={false} secureTextEntry />
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.changeButton}>
          <Text style={{ color: 'white' }}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Password Change Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: Colors[theme].background2 }]}>
            <ThemedText type="title" style={{ color: Colors[theme].text, fontWeight: 'bold' }}>Change Password</ThemedText>

            {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

            <TextInput
              style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].background }]}
              placeholder="Old Password"
              placeholderTextColor={Colors[theme].placeholder}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].background }]}
              placeholder="New Password"
              placeholderTextColor={Colors[theme].placeholder}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={[styles.input, { color: Colors[theme].text, backgroundColor: Colors[theme].background }]}
              placeholder="Confirm Password"
              placeholderTextColor={Colors[theme].placeholder}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity style={styles.modalButton} onPress={handlePasswordChange}>
              <Text style={{ color: 'white' }}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: 'gray' }]} onPress={() => setModalVisible(false)}>
              <Text style={{ color: 'white' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  changeButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#007AFF',
    borderRadius: 5
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080'
  },
  modalContent: {
    width: 300,
    padding: 20,
    borderRadius: 10,
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    borderRadius: 5
  }
});
