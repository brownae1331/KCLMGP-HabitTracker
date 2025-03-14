import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoodHabitGraph from '../../components/GoodHabitGraph';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { SharedStyles } from '../../components/styles/SharedStyles';
import { Habit } from '../../lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string | null>(null);
  const { theme } = useTheme();

  const pickerStyle = {
    ...styles.picker,
    color: theme === 'dark' ? '#ffffff' : '#000000',
    backgroundColor: theme === 'dark' ? '#333333' : '#ffffff',
  };

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Error retrieving username:', error);
      }
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    if (!username) return;
  
    const fetchHabits = async () => {
      try {
        const response = await fetch(`http://localhost:3000/habits/${username}`);
  
        if (!response.ok) {
          throw new Error(`Failed to fetch habits: ${response.statusText}`);
        }
  
        const data = await response.json();
  
        if (Array.isArray(data)) {
          setHabits(data);
        } else {
          console.error('Invalid habits response format:', data);
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
  }, [username]);

  // useEffect(() => {
  //   if (habits.length > 0) {
  //     setSelectedHabit(habits[0].habitName);
  //   }
  // }, [habits]);

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
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>
            Stats
          </ThemedText>
        </View>

        {habits.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <ThemedText type="subtitle">
              You don't have any habits yet! Create a habit before seeing statistics about it.
            </ThemedText>
          </View>
        ) : (
          <>
            <View>
              <Picker
                selectedValue={selectedHabit}
                onValueChange={(itemValue) => setSelectedHabit(itemValue)}
                style={pickerStyle}
              >
                <Picker.Item label="Please select a habit..." value={null} />
                {habits.map((habit: Habit) => (
                  <Picker.Item label={habit.habitName} value={habit.habitName} key={habit.habitName} />
                ))}
              </Picker>
            </View>

            {selectedHabit ? (
              <GoodHabitGraph habit={selectedHabit} />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText type="subtitle">
                  Please select a habit to see statistics about your progress!
                </ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 50,
    width: '100%',
  },
});