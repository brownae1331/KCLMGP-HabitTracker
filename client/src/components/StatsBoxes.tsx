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
  const stats = [
    { value: currentStreak, label: 'Current Streak' },
    { value: longestStreak, label: 'Longest Streak' },
    { value: `${completionRate}%`, label: 'completion Rate' },
    { value: fourthStat.value, label: fourthStat.label },
  ];

  return (
    <View style={[styles.statsContainer, { backgroundColor: Colors[theme].pickerBackground }]}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[styles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}
        >
          <ThemedText style={[styles.statValue, {color: Colors[theme].text}]}>{stat.value}</ThemedText>
          <ThemedText style={[styles.statLabel, {color: Colors[theme].backgroundText}]}>{stat.label}</ThemedText>
        </View>
      ))}
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
    borderRadius: 8,
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