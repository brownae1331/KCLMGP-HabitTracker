import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Account */}
      <View style={[styles.section, { backgroundColor: Colors[theme].background }]}>
        <ThemedText type="title" style={[styles.headerText, { color: Colors[theme].text }]}>
          Account Information
        </ThemedText>
      </View>

      {/* Username */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
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
          editable={false} // Username is not editable
        />
      </View>

      {/* Email Section */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Email Address</ThemedText>
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: Colors[theme].text, borderColor: Colors[theme].border },
            ]}
            placeholder="Your email"
            placeholderTextColor={Colors[theme].placeholder}
            editable={false} // Email is not editable
          />
          <TouchableOpacity style={styles.iconButton}>
            <ThemedText style={[styles.changeText, { color: theme === 'dark' ? '#3399FF' : 'blue' }]}>
              Change
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Section */}
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background }]}>
        <ThemedText style={[styles.label, { color: Colors[theme].text }]}>Password</ThemedText>
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: Colors[theme].text, borderColor: Colors[theme].border },
            ]}
            placeholder="********"
            placeholderTextColor={Colors[theme].placeholder}
            secureTextEntry
            editable={false} // Password field should not be directly editable
          />
          <TouchableOpacity style={styles.iconButton}>
            <ThemedText style={[styles.changeText, { color: theme === 'dark' ? '#3399FF' : 'blue' }]}>
              Change
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
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
  iconButton: {
    marginLeft: 10,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

