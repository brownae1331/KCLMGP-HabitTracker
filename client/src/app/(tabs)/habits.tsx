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
import { addHabit, getHabitsForDate } from '../../lib/client';
//import { getHabits } from '../../lib/client';
import HabitPanel, { Habit } from '../../components/HabitPanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: Date }>({
    date: today.getDate(),
    fullDate: today
  });
  // State for modal and habit form
  const [email, setEmail] = useState('');
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

  const [isEditMode, setIsEditMode] = useState(false);

  const handleAddHabit = async () => {
    try {
      const newHabit = {
        email: email,
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

      await addHabit(newHabit);
      fetchHabits(); // Refresh the habit list after adding a new habit

    } catch (error) {
      console.error('Error adding habit:', error);
    }

    // Reset form values and close modal
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
    setIsEditMode(false);
    setModalVisible(false);
  };

  const [dbHabits, setDbHabits] = useState<any[]>([]);

  // const fetchHabits = async () => {
  //   try {
  //     const habits = await getHabits(email);

  //     const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  //     const selectedDayName = dayNames[selectedDate.fullDate.getDay()];

  //     const filtered = habits.filter((habit: any) => {
  //       if (habit.scheduleOption === 'weekly') {
  //         // For weekly habits, check if the selected day's name is in the selectedDays array.
  //         return habit.selectedDays && habit.selectedDays.includes(selectedDayName);
  //       } else {
  //         // For interval (or date-specific) habits, check the habit.date.
  //         if (!habit.date) return false;
  //         const habitDate = new Date(habit.date);
  //         return (
  //           habitDate.getDate() === selectedDate.fullDate.getDate() &&
  //           habitDate.getMonth() === selectedDate.fullDate.getMonth() &&
  //           habitDate.getFullYear() === selectedDate.fullDate.getFullYear()
  //         );
  //       }
  //     });
  //     setDbHabits(filtered);
  //   } catch (error) {
  //     console.error('Error fetching habits for selected date:', error);
  //   }
  // };

  const fetchHabits = async () => {
    try {
      const dateString = selectedDate.fullDate.toISOString().split('T')[0];
      const habits = await getHabitsForDate(email, dateString);
      setDbHabits(habits);
    } catch (error) {
      console.error('Error fetching habits for selected date:', error);
    }
  };

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) {
          setEmail(storedEmail);
        }
      } catch (error) {
        console.error('Error loading email from AsyncStorage:', error);
      }
    };

    loadEmail();
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [selectedDate, email]);

  // Add a function to handle editing a habit
  const handleEditHabit = (habit: Habit) => {
    // Pre-fill the form with the habit's data
    setHabitName(habit.habitName);
    setHabitDescription(habit.habitDescription);
    setHabitType(habit.habitType);
    setHabitColor(habit.habitColor);
    setScheduleOption(habit.scheduleOption);

    if (habit.intervalDays) {
      setIntervalDays(habit.intervalDays.toString());
      console.log(habit.intervalDays);
    }

    if (habit.selectedDays) {
      setSelectedDays(habit.selectedDays);
      console.log(habit.selectedDays);
    }

    const hasGoal = habit.goalValue !== null && habit.goalUnit !== null;
    setIsGoalEnabled(hasGoal);

    if (habit.goalValue) {
      setGoalValue(habit.goalValue.toString());
    }

    if (habit.goalUnit) {
      setGoalUnit(habit.goalUnit);
    }

    setIsEditMode(true);
    setModalVisible(true);
  };

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
              <HabitPanel
                key={`${habit.user_email}-${habit.habitName}`}
                habit={habit}
                onEdit={handleEditHabit}
              />
            ))
          ) : (
            <ThemedText>No habits found for this date.</ThemedText>
          )}
        </View>

        {/* Add Habit Button */}
        <View style={[SharedStyles.addButtonContainer, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={() => {
            setIsEditMode(false);
            setModalVisible(true);
          }}>
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
          isEditMode={isEditMode}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
