import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoodHabitGraph from '../../components/GoodHabitGraph';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';

interface Habit {
  user_email: string;
  habitName: string;
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
  const [selectedHabit, setSelectedHabit ]= useState('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setloading] = useState(true);
 //const [username, setUsername] = useState('');
  const username = 'doris'; //hardcoded, need to change later

  // useEffect(() => {
  //   const fetchUsername = async () => {

  //   }
  // }, []);
  
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch(`http://localhost:3000/habits/${username}`);
        const data = await response.json();
        console.log("Fetched habits data:", data);
  
        if (Array.isArray(data)) {
          setHabits(data);
        } else {
          console.error("Invalid response format:", data);
          setHabits([]);
        }
      } catch (error) {
        console.error("Error fetching habits:", error);
        setHabits([]);
      } finally {
        setloading(false);
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

        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Stats</ThemedText>
        </ThemedView>

        {habits.length === 0 ? (
          <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <ThemedText type="subtitle">
            You don't have any habits yet! Create a habit before seeing statistics about it.
            </ThemedText>
          </ThemedView>
        ) : (
          <>
            <ThemedView>
              <Picker
                selectedValue={selectedHabit}
                onValueChange={(itemValue) => setSelectedHabit(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Please select a habit..." value={null}/>
                {habits.map((habit: Habit) => (
                  <Picker.Item label={habit.habitName} value={habit.habitName} key={habit.habitName} />
                ))}
              </Picker>
            </ThemedView>

            {selectedHabit ? (
              <GoodHabitGraph habit={selectedHabit} />
            ) : (
              <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText type="subtitle">
                  Please select a habit to see statistics about your progress!
                </ThemedText>
              </ThemedView>
            )}
          </>
        )}        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // headerImage: {
  //   color: '#808080',
  //   bottom: -90,
  //   left: -35,
  //   position: 'absolute',
  // },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  pickerContainer: {
    margin: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  picker: {
    height: 50,
    width: '100%',
  },
});