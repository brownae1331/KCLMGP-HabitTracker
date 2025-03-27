import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, View, SafeAreaView, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import { StatsPageStyles } from '../../../components/styles/StatsPageStyles';
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

// Stats screen component - displays user habit statistics with selectable graphs based on habit type
export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string>("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { theme } = useTheme();

  // Fetch user's email from AsyncStorage
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

  // Fetch habits from the backend each time the user accesses the screen
  useFocusEffect(
    useCallback(() => {
      if (!email) return;

      const fetchHabitsData = async () => {
        try {
          setRefreshing(true);
          const data = await fetchHabits(email);
          setHabits(data);

          // Reset selected habit if it no longer exists
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
    }, [email])
  );

  // Show loading indicator while retrieving stored email
  if (loading) {
    return (
      <SafeAreaView testID="safeAreaView" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator testID="activityIndicator" size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  // Find the full habit object for the selected habit
  const selectedHabitData = habits.find(h => h.habitName === selectedHabit);

  return (
    <SafeAreaView testID="safeAreaView" style={{ flex: 1, backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background2 }}>
      <ScrollView testID="scrollView" style={{ flex: 1 }}>
        <View testID="titleContainer" style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText testID="titleText" type="title" style={{ color: Colors[theme].text }}>Stats</ThemedText>
        </View>

        {habits.length === 0 ? (
          <View testID="messageContainer" style={StatsPageStyles.messageContainer}>
            <ThemedText testID="messageText" type="subtitle" style={StatsPageStyles.messageText}>
              You don't have any habits yet! Create a habit to see statistics.
            </ThemedText>
          </View>
        ) : (
          <>
            <View testID="pickerContainer" style={[StatsPageStyles.pickerContainer, { 
              backgroundColor: Colors[theme].graphBackground, 
              borderColor: Colors[theme].pickerBackground }]}>
              <Picker
                testID="picker"
                selectedValue={selectedHabit}
                onValueChange={(itemValue) => setSelectedHabit(itemValue)}
                style={[StatsPageStyles.picker, { 
                  backgroundColor: theme === 'dark' ? Colors.dark.background2 : '#FAFAFA', 
                  color: Colors[theme].text,
                  borderColor: Colors[theme].graphBackground, }]}
              >
                <Picker.Item
                  testID="pickerItenDefault"
                  label="Select a habit..."
                  value={null}
                  color={Colors[theme].backgroundText}
                />
                {habits.map((habit) => (
                  <Picker.Item
                    testID={`pickerItem-${habit.habitName}`}
                    key={habit.habitName}
                    label={habit.habitName}
                    value={habit.habitName}
                    color={Colors[theme].text}
                  />
                ))}
              </Picker>
            </View>

            {selectedHabit && selectedHabitData && email ? (
              <View testID="graphContainer" style={StatsPageStyles.graphContainer}>
                  {(selectedHabitData.habitType === 'build' && selectedHabitData.goalValue !== null) ? (
                    <BuildHabitGraph email={email} habitName={selectedHabit} />
                  ) : (
                    <QuitHabitGraph email={email} habitName={selectedHabit} />
                  )}
              </View>
            ) : (
              <View testID="messageContainer" style={StatsPageStyles.messageContainer}>
                <ThemedText testID="messageText" type="subtitle" style={StatsPageStyles.messageText}>
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