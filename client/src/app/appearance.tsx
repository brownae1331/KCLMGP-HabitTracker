import { StyleSheet, Switch, View } from 'react-native';
import React from 'react';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useTheme } from '../components/ThemeContext';

export default function AppearanceScreen() {
    const { theme, toggleTheme } = useTheme();
  
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">Appearance</ThemedText>
        <View style={styles.settingItem}>
          <ThemedText>Dark Mode</ThemedText>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </View>
      </ThemedView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      paddingVertical: 15,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#ccc',
    },
  });