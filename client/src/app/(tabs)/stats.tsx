import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoodHabitGraph from '../../components/GoodHabitGraph';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { CalendarPageStyles } from '../../components/styles/CalendarPageStyles';

interface Habit {
  username: string;
  name: string;
  description?: string;
  amount?: number;
  positive?: boolean;
  date?: string;
  increment?: number;
  location?: string;
  notifications_allowed?: boolean;
  notification_sound?: string;
  streak?: number;
}

export default function StatsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const username = 'your_username';
  const { theme } = useTheme();

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch(`http://localhost:3000/habits/${username}`);
        const data: Habit[] = await response.json();
        
        if (Array.isArray(data)) {
          setHabits(data);
        } else {
          console.error("Invalid response format:", data);
          setHabits([]);
        }
      } catch (error) {
        console.error('Error fetching habits:', error);
        setHabits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, []);

  const [selectedHabit, setSelectedHabit] = useState<string>('');

  useEffect(() => {
    if (habits.length > 0) {
      setSelectedHabit(habits[0].name);
    }
  }, [habits]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <ThemedView style={[CalendarPageStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>
            Stats
          </ThemedText>
        </ThemedView>

        <ThemedView>
          <Picker
            selectedValue={selectedHabit}
            onValueChange={(itemValue) => setSelectedHabit(itemValue)}
            style={styles.picker}
          >
            {Array.isArray(habits) && habits.length > 0 ? (
              habits.map((habit, index) => (
                <Picker.Item label={habit.name} value={habit.name} key={habit.name + index} />
              ))
            ) : (
              <Picker.Item label="No habits available" value="" />
            )}
          </Picker>
        </ThemedView>

        <GoodHabitGraph habit={selectedHabit} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});
