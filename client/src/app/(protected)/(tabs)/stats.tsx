import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { SharedStyles } from '../../../components/styles/SharedStyles';
//import { Habit } from '../../../lib/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BuildHabitGraph from '../../../components/BuildHabitGraph';
import QuitHabitGraph from '../../../components/QuitHabitGraph';

type Habit = {
  habitName: string;
  habitType: 'build' | 'quit';
};

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<'7' | '30' | 'year'>('7');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  const pickerStyle = {
    ...styles.picker,
    color: theme === 'dark' ? '#ffffff' : '#000000',
    backgroundColor: theme === 'dark' ? '#333333' : '#ffffff',
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedEmail = await AsyncStorage.getItem('email');
        console.log('Stored username:', storedUsername, 'Stored email:', storedEmail);
        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        console.error('Error retrieving user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // useEffect(() => {
  //   if (!username) return;

  //   const fetchHabits = async () => {
  //     try {
  //       const response = await fetch(`http://localhost:3000/habits/${username}`);

  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch habits: ${response.statusText}`);
  //       }

  //       const data = await response.json();

  //       if (Array.isArray(data)) {
  //         setHabits(data);
  //       } else {
  //         console.error('Invalid habits response format:', data);
  //         setHabits([]);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching habits:', error);
  //       setHabits([]);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchHabits();
  // }, [username]);

  // temporary fake habits data
  useEffect(() => {
    const fakeHabits: Habit[] = [
      { habitName: 'Drink Water', habitType: 'build' },
      { habitName: 'Quit Smoking', habitType: 'quit' },
      { habitName: 'Exercise', habitType: 'build' },
    ];
    setHabits(fakeHabits);
    setLoading(false);
  }, [username]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const selectedHabitData = habits.find(h => h.habitName === selectedHabit);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>Stats</ThemedText>
        </View>
        
        {habits.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <ThemedText type="subtitle">
              You don’t have any habits yet! Create a habit to see statistics.
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
                <Picker.Item label="Select a habit..." value={null} />
                {habits.map(habit => (
                  <Picker.Item label={habit.habitName} value={habit.habitName} key={habit.habitName} />
                ))}
              </Picker>
            </View>

            {selectedHabit && selectedHabitData && email ? (
              selectedHabitData.habitType === 'build' ? (
                <BuildHabitGraph email={email} habitName={selectedHabit} />
              ) : (
                <QuitHabitGraph email={email} habitName={selectedHabit} />
              )
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText type="subtitle">Select a habit to see statistics about your progress!</ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  picker: { height: 50, width: '100%' },
});