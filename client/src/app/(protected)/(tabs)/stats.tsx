import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View, SafeAreaView, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BuildHabitGraph from '../../../components/BuildHabitGraph';
import QuitHabitGraph from '../../../components/QuitHabitGraph';
import { BASE_URL } from '../../../lib/client';
import { useFocusEffect } from '@react-navigation/native';

type Habit = {
  habitName: string;
  habitType: 'build' | 'quit';
  goalValue: number | null;
};

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  const pickerStyle = {
    ...styles.picker,
    backgroundColor: theme === 'dark' ? Colors.dark.background2 : '#FAFAFA',
    color: Colors[theme].text,
    borderColor: Colors[theme].graphBackground,
  };

  const pickerContainerStyle = {
    ...styles.pickerContainer,
    backgroundColor: Colors[theme].graphBackground,
    borderColor: Colors[theme].pickerBackground,
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        console.error('Error retrieving user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const fetchHabits = useCallback(async () => {
    if (!email) return;

    try {
      const response = await fetch(`${BASE_URL}/habits/${email}`);
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
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [fetchHabits])
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const selectedHabitData = habits.find(h => h.habitName === selectedHabit);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background2 }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>Stats</ThemedText>
        </View>

        {habits.length === 0 ? (
          <View style={styles.messageContainer}>
            <ThemedText type="subtitle" style={styles.backgroundText}>
              You don't have any habits yet! Create a habit to see statistics.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={pickerContainerStyle}>
              <Picker
                selectedValue={selectedHabit}
                onValueChange={(itemValue) => setSelectedHabit(itemValue)}
                style={pickerStyle}
              >
                <Picker.Item
                  label="Select a habit..."
                  value={null}
                  color={theme === 'dark' ? Colors.dark.backgroundText : Colors.light.backgroundText}
                />
                {habits.map((habit) => (
                  <Picker.Item
                    key={habit.habitName}
                    label={habit.habitName}
                    value={habit.habitName}
                    color={theme === 'dark' ? Colors.dark.text : Colors.light.text}
                  />
                ))}
              </Picker>
            </View>

            {selectedHabit && selectedHabitData && email ? (
              <View style={styles.graphSection}>
                <View style={styles.graphContainer}>
                  {(selectedHabitData.habitType === 'build' && selectedHabitData.goalValue !== null) ? (
                    <BuildHabitGraph email={email} habitName={selectedHabit} />
                  ) : (
                    <QuitHabitGraph email={email} habitName={selectedHabit} />
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.messageContainer}>
                <ThemedText type="subtitle" style={styles.backgroundText}>
                  Select a habit above to see statistics about your progress!
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
  pickerContainer: {
    width: '80%',
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
  },
  picker: {
    height: 50,
    borderRadius: 10,
  },
  graphSection: {
    marginHorizontal: 30,
    marginVertical: 10,
    borderRadius: 10,
  },
  graphContainer: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 10,
    padding: 20,
  },
  backgroundText: {
    fontSize: 20,
    textAlign: 'center',
    maxWidth: 400,
    color: Colors.light.backgroundText,
  },
});