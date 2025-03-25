import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  View,
  Alert,
} from 'react-native';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { WeeklyCalendar } from '../../../components/WeeklyCalendar';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import { NewHabitModal } from '../../../components/NewHabitModal';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { addHabit, getHabitDays, getHabitInterval, getHabitsForDate, updateHabit } from '../../../lib/client';
//import { getHabits } from '../../lib/client';
import HabitPanel, { Habit } from '../../../components/HabitPanel';
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
  const [habitColor, setHabitColor] = useState('#a39d41');

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

  const [currentEditHabit, setCurrentEditHabit] = useState<Habit | null>(null);

  const handleAddHabit = async () => {
    // 1. Validate Habit Name: It must not be empty.
    if (!habitName || habitName.trim() === '') {
      // Alert.alert("Validation Error", "Habit name cannot be empty."); FOR MOBILE
      window.alert("Habit name cannot be empty.");
      return;
    }

    // 2. Validate Habit Name Uniqueness: BUT only for new habits or when the name has changed
    if (!isEditMode && dbHabits.some((habit: any) => habit.habitName.toLowerCase() === habitName.trim().toLowerCase())) {
      // Alert.alert("Validation Error", "A habit with this name already exists for this user.");
      window.alert("A habit with this name already exists for this user.");
      return;
    }

    // For edit mode, only check for duplicate names if the name has changed
    if (isEditMode && currentEditHabit && habitName.trim().toLowerCase() !== currentEditHabit.habitName.toLowerCase()) {
      if (dbHabits.some((habit: any) =>
        habit.habitName.toLowerCase() === habitName.trim().toLowerCase() &&
        habit.habitName.toLowerCase() !== currentEditHabit.habitName.toLowerCase()
      )) {
        window.alert("A habit with this new name already exists for this user.");
        return;
      }
    }

    // 3. Validate Color: If no color is picked, default to yellow (#FFFF00)
    let chosenColor = habitColor;
    if (!chosenColor || chosenColor.trim() === '') {
      chosenColor = '#FFFF00'; // default yellow
    }

    // 4. If schedule is "interval", ensure intervalDays is a valid number.
    if (scheduleOption === 'interval') {
      if (!intervalDays || isNaN(parseInt(intervalDays, 10))) {
        // Alert.alert("Validation Error", "Please enter a valid number of days for the interval schedule.");
        window.alert("Please enter a valid number of days for the interval schedule.");
        return;
      }
    }

    // 5. If schedule is "weekly", ensure at least one day is selected.
    if (scheduleOption === 'weekly') {
      if (!selectedDays || selectedDays.length === 0) {
        // Alert.alert("Validation Error", "Please select at least one day for the weekly schedule.");
        window.alert("Please select at least one day for the weekly schedule.");
        return;
      }
    }

    // Construct the new habit object with validations applied
    const newHabit = {
      email: email, // assuming this is set correctly
      habitName: habitName.trim(),
      habitDescription,
      habitType,
      habitColor: chosenColor,
      scheduleOption,
      intervalDays: scheduleOption === 'interval' ? parseInt(intervalDays, 10) : null,
      selectedDays: scheduleOption === 'weekly' ? selectedDays : [],
      goalValue: isGoalEnabled ? parseFloat(goalValue) : null,
      goalUnit: isGoalEnabled ? goalUnit : null,
    };

    try {
      if (isEditMode && currentEditHabit) {
        // If editing, update the existing habit
        await updateHabit(newHabit);
      } else {
        // If adding, create a new habit
        await addHabit(newHabit);
      }

      await fetchHabits();

    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} habit:`, error);
    }

    // Reset form values and close modal
    setHabitName('');
    setHabitDescription('');
    setHabitType('build');
    setHabitColor('#FFFF00');
    setScheduleOption('interval');
    setIntervalDays('');
    setSelectedDays([]);
    setIsGoalEnabled(false);
    setGoalValue('');
    setGoalUnit('');
    setIsEditMode(false);
    setCurrentEditHabit(null);
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
  const handleEditHabit = async (habit: Habit) => {
    // Store the current habit being edited
    setCurrentEditHabit(habit);

    // Pre-fill the form with the habit's data
    setHabitName(habit.habitName);
    setHabitDescription(habit.habitDescription);
    setHabitType(habit.habitType);
    setHabitColor(habit.habitColor);
    setScheduleOption(habit.scheduleOption);

    try {
      if (habit.scheduleOption === 'interval') {
        const interval = await getHabitInterval(email, habit.habitName);
        setIntervalDays(interval.increment.toString());
      } else if (habit.scheduleOption === 'weekly') {
        const daysResponse = await getHabitDays(email, habit.habitName);
        // Extract just the day names from the response objects
        const dayNames = daysResponse.map((dayObj: { day: string }) => dayObj.day);
        setSelectedDays(dayNames);
      }
    } catch (error) {
      console.error('Error fetching habit interval or days:', error);
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

  const handleHabitDelete = () => {
    fetchHabits();
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

        {/* Habit Panel */}
        <View>
          {dbHabits.length > 0 ? (
            dbHabits.map((habit: Habit) => (
              <HabitPanel
                key={`${habit.user_email}-${habit.habitName}`}
                habit={habit}
                onEdit={handleEditHabit}
                onDelete={handleHabitDelete}
                selectedDate={selectedDate.fullDate}
              />
            ))
          ) : (
            <ThemedText>No habits found for this date.</ThemedText>
          )}
        </View>

        {/* Add Habit Button */}
        <View style={[SharedStyles.addButtonContainer, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={() => {
            // Reset all form fields when opening the modal
            setHabitName('');
            setHabitDescription('');
            setHabitType('build');  // This is a default, but for clarity
            setHabitColor('');  // Clear color
            setScheduleOption('interval');
            setIntervalDays('');
            setSelectedDays([]);
            setIsGoalEnabled(false);
            setGoalValue('');
            setGoalUnit('');

            // Then set edit mode and show modal
            setIsEditMode(false);
            setModalVisible(true);
          }}>
            <IconSymbol name="plus" size={24} color="#a39d41" />
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
