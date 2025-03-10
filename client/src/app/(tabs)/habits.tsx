import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  View,
} from 'react-native';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { SharedStyles } from '../../components/styles/SharedStyles';
import { NewHabitModal } from '../../components/NewHabitModal';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { getHabitsByUser } from '../../lib/client';
import HabitPanel, { Habit } from '../../components/HabitPanel'; // adjust the path as needed



export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: Date }>({
    date: today.getDate(),
    fullDate: today
  });
  const [email, setEmail] = useState('');
  // State for modal and habit form
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitType, setHabitType] = useState<'build' | 'quit'>('build');
  const [habitColor, setHabitColor] = useState('#007AFF');

  // State for scheduling options
  const [scheduleOption, setScheduleOption] = useState<'interval' | 'weekly'>('interval');
  const [intervalDays, setIntervalDays] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Goal fields (only relevant for build type)
  const [isGoalEnabled, setIsGoalEnabled] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const { theme } = useTheme();
  // Example array of color swatches
  const colorOptions = [
    '#FF0000', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#007AFF', // Blue
    '#AF52DE', // Purple
    '#8E8E93', // Gray
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddHabit = async () => {
    // Prepare the habit data object
    const newHabit = {
      email: email || 'hugo@gmail.com', // Ensure email is set (using your dummy email here)
      habitName,
      habitDescription,
      habitType,
      habitColor,
      scheduleOption,
      intervalDays: intervalDays ? parseInt(intervalDays, 10) : null,
      selectedDays,
      goalValue: isGoalEnabled ? parseFloat(goalValue) : null,
      goalUnit: isGoalEnabled ? goalUnit : null,
    };

    try {
      const response = await fetch('http://localhost:3000/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });
      const data = await response.json();
      console.log('Habit added successfully:', data);
      // Optionally, refresh your habit list here
    } catch (error) {
      console.error('Error adding habit:', error);
    }

    // Reset form values and close modal
    setEmail('hugo@gmail.com'); // dummy email
    setHabitName('');
    setHabitDescription('');
    setHabitType('build');
    setHabitColor('#007AFF');
    setScheduleOption('interval');
    setIntervalDays('');
    setSelectedDays([]);
    setIsGoalEnabled(false);
    setGoalValue('');
    setGoalUnit('');
    setModalVisible(false);
  };

  const [dbHabits, setDbHabits] = useState<any[]>([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const habits = await getHabitsByUser('hugo@gmail.com');

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDayName = dayNames[selectedDate.fullDate.getDay()];

        const filtered = habits.filter((habit: any) => {
          if (habit.scheduleOption === 'weekly') {
            // For weekly habits, check if the selected day's name is in the selectedDays array.
            return habit.selectedDays && habit.selectedDays.includes(selectedDayName);
          } else {
            // For interval (or date-specific) habits, check the habit.date.
            if (!habit.date) return false;
            const habitDate = new Date(habit.date);
            return (
              habitDate.getDate() === selectedDate.fullDate.getDate() &&
              habitDate.getMonth() === selectedDate.fullDate.getMonth() &&
              habitDate.getFullYear() === selectedDate.fullDate.getFullYear()
            );
          }
        });
        setDbHabits(filtered);
      } catch (error) {
        console.error('Error fetching habits for selected date:', error);
      }
    };

    fetchHabits();
  }, [selectedDate]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>

        {/* Today/Selected Date */}
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text, textAlign: 'center', width: '100%' }}>
            {selectedDate.date === today.getDate()
              ? "Today"
              : selectedDate.fullDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </ThemedText>
        </View>

        {/* Weekly Calendar */}
        <WeeklyCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
        <View>
          {dbHabits.length > 0 ? (
            dbHabits.map((habit: Habit) => (
              <HabitPanel key={'$habit.email}-${habit.habitName'} habit={habit} />
            ))
          ) : (
            <ThemedText>No habits found for this date.</ThemedText>
          )}
        </View>

        {/* Add Habit Button */}
        <View style={[SharedStyles.addButtonContainer, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* New Habit Modal */}
        <NewHabitModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          habitName={habitName}
          setHabitName={setHabitName}
          habitDescription={habitDescription}
          setHabitDescription={setHabitDescription}
          habitType={habitType}
          setHabitType={setHabitType}
          habitColor={habitColor}
          setHabitColor={setHabitColor}
          scheduleOption={scheduleOption}
          setScheduleOption={setScheduleOption}
          intervalDays={intervalDays}
          setIntervalDays={setIntervalDays}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          isGoalEnabled={isGoalEnabled}
          setIsGoalEnabled={setIsGoalEnabled}
          goalValue={goalValue}
          setGoalValue={setGoalValue}
          goalUnit={goalUnit}
          setGoalUnit={setGoalUnit}
          onAddHabit={handleAddHabit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}





