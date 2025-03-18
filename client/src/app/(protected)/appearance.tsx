import { StyleSheet, Switch, View } from 'react-native';
import React from 'react';
import { ThemedText } from '../../components/ThemedText';
import { useTheme } from '../../components/ThemeContext';
import { Colors } from '../../components/styles/Colors';

export default function AppearanceScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <ThemedText type="title" style={{ color: Colors[theme].text }}>Appearance</ThemedText>
      <View style={styles.settingItem}>
        <ThemedText style={{ color: Colors[theme].text }}>Dark Mode</ThemedText>
        <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
      </View>
    </View>
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