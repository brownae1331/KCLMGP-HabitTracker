import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';

interface StatsBoxesProps {
  currentStreak: number;
  longestStreak: number;
    completionRate: number;
  fourthStat: {
    label: string;
    value: string | number;
  };
}

const StatsBoxes: React.FC<StatsBoxesProps> = ({ currentStreak, longestStreak, completionRate, fourthStat }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.statsContainer}>
      <View style={[styles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}>
        <ThemedText style={[styles.statValue, { color: Colors[theme].text }]}>{currentStreak}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: Colors[theme].backgroundText }]}>Current Streak</ThemedText>
      </View>
      <View style={[styles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}>
        <ThemedText style={[styles.statValue, { color: Colors[theme].text }]}>{longestStreak}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: Colors[theme].backgroundText }]}>Longest Streak</ThemedText>
      </View>
      <View style={[styles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}>
        <ThemedText style={[styles.statValue, { color: Colors[theme].text }]}>{completionRate}%</ThemedText>
        <ThemedText style={[styles.statLabel, { color: Colors[theme].backgroundText }]}>completion Rate</ThemedText>
      </View>
      <View style={[styles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}>
        <ThemedText style={[styles.statValue, { color: Colors[theme].text }]}>{fourthStat.value}</ThemedText>
        <ThemedText style={[styles.statLabel, { color: Colors[theme].backgroundText }]}>{fourthStat.label}</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: '5%',
    paddingHorizontal: '5%',
    paddingBottom: '5%',
  },
  statBox: {
    width: '45%',
    borderRadius: 8,
    padding: 15,
    marginBottom: '5%',
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default StatsBoxes;