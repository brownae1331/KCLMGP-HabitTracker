import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoodHabitGraph from '../../components/GoodHabitGraph';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit ]= useState('');
  const [habits, setHabits] = useState([]);
  const [loading, setloading] = useState(true);
  const username = 'your_username';

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await fetch(`http://<YOUR_SERVER_IP>:3000/habits/${username}`)
        const data = await response.json();
        setHabits(data);
        if (data.length > 0) {
          setSelectedHabit(data[0].name);
        } 
      }catch (error) {
        console.error('Error fetching habits:', error);
      }finally {
        setloading(false);
      }
      
    };
    fetchHabits();
  }, []);

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

        <ThemedView>
          <Picker
            selectedValue={selectedHabit}
            onValueChange={(itemValue) => setSelectedHabit(itemValue)}
            style={styles.picker}
          >
            {habits.map((habit) => (
              <Picker.Item label={habit.name} value={habit.name} key={habit.name} />
            ))}
          </Picker>
        </ThemedView>

        <GoodHabitGraph habit={selectedHabit} />
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