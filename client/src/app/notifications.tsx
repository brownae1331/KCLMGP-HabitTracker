import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ThemedView style={[styles.section, { backgroundColor: Colors[theme].background }]}> 
        <ThemedText type="title" style={[styles.headerText, { color: Colors[theme].text }]}> 
          Notifications
        </ThemedText>
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
});
