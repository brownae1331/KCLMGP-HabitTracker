import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';
import { StatsBoxesStyles } from './styles/StatsBoxesStyles';

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
    <View style={[StatsBoxesStyles.statsContainer, { backgroundColor: Colors[theme].pickerBackground }]}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[StatsBoxesStyles.statBox, { backgroundColor: Colors[theme].graphBackground, borderColor: Colors[theme].border }]}
        >
          <ThemedText style={[StatsBoxesStyles.statValue, {color: Colors[theme].text}]}>{stat.value}</ThemedText>
          <ThemedText style={[StatsBoxesStyles.statLabel, {color: Colors[theme].backgroundText}]}>{stat.label}</ThemedText>
        </View>
      ))}
    </View>
  );
};

export default StatsBoxes;