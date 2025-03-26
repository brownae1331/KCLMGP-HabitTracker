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
import { fetchHabits } from '../../../lib/client';
import { useFocusEffect } from '@react-navigation/native';

type Habit = {
  habitName: string;
  habitType: 'build' | 'quit';
  goalValue: number | null;
};

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string>("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { theme } = useTheme();

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

  useFocusEffect(
    useCallback(() => {
      if (!email) return;

      const fetchHabitsData = async () => {
        try {
          setRefreshing(true);
          const data = await fetchHabits(email);
          setHabits(data);

          // Reset selection if the selected habit no longer exists
          if (selectedHabit && !data.some(habit => habit.habitName === selectedHabit)) {
            setSelectedHabit("");
          }
        } catch (error) {
          console.error('Error fetching habits:', error);
          setHabits([]);
        } finally {
          setRefreshing(false);
        }
      };

      fetchHabitsData();
    }, [email, selectedHabit])
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors[theme].tint} />
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
            <ThemedText type="subtitle" style={styles.messageText}>
              You don't have any habits yet! Create a habit to see statistics.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={[styles.pickerContainer, {
              backgroundColor: Colors[theme].graphBackground,
              borderColor: Colors[theme].pickerBackground
            }]}>
              <Picker
                selectedValue={selectedHabit}
                onValueChange={(itemValue) => setSelectedHabit(itemValue)}
                style={[styles.picker, {
                  backgroundColor: theme === 'dark' ? Colors.dark.background2 : '#FAFAFA',
                  color: Colors[theme].text,
                  borderColor: Colors[theme].graphBackground,
                }]}
              >
                <Picker.Item
                  label="Select a habit..."
                  value=""
                  color={Colors[theme].backgroundText}
                />
                {habits.map((habit) => (
                  <Picker.Item
                    key={habit.habitName}
                    label={habit.habitName}
                    value={habit.habitName}
                    color={Colors[theme].text}
                  />
                ))}
              </Picker>
            </View>

            {refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
                <ThemedText style={styles.loadingText}>Loading stats...</ThemedText>
              </View>
            ) : selectedHabit && selectedHabitData && email ? (
              <View style={styles.graphContainer}>
                {(selectedHabitData.habitType === 'build' && selectedHabitData.goalValue !== null) ? (
                  <BuildHabitGraph email={email} habitName={selectedHabit} />
                ) : (
                  <QuitHabitGraph email={email} habitName={selectedHabit} />
                )}
              </View>
            ) : (
              <View style={styles.messageContainer}>
                <ThemedText type="subtitle" style={styles.messageText}>
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
  graphContainer: {
    marginHorizontal: 30,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageContainer: {
    alignSelf: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 10,
    padding: 20,
  },
  messageText: {
    fontSize: 20,
    textAlign: 'center',
    maxWidth: 400,
    color: Colors.light.backgroundText,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 50
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16
  }
});