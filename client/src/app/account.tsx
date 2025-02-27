import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserDetails } from '../lib/client'; // 🔹 Import new function

export default function AccountScreen() {
  const { theme } = useTheme();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');

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
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ThemedView style={[styles.section, { backgroundColor: Colors[theme].background }]}>
        <ThemedText type="title" style={[styles.headerText, { color: Colors[theme].text }]}>
          Account Information
        </ThemedText>
      </ThemedView>

      {/* Username Field */}
      <ThemedView style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Username</ThemedText>
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[theme].text,
              borderColor: Colors[theme].border,
              backgroundColor: theme === 'dark' ? '#222' : '#FFF',
            },
          ]}
          placeholder="Your username"
          placeholderTextColor={Colors[theme].placeholder}
          value={username}
          editable={false}
        />
      </ThemedView>

      {/* Email Field */}
      <ThemedView style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Email Address</ThemedText>
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: Colors[theme].text, borderColor: Colors[theme].border },
            ]}
            placeholder="Your email"
            placeholderTextColor={Colors[theme].placeholder}
            value={email}
            editable={false}
          />
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
