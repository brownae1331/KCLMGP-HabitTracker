import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ScrollView, SafeAreaView, View, Alert, StyleSheet, Text, Platform } from 'react-native';
import { IconSymbol } from '../../../components/ui/IconSymbol';
import { WeeklyCalendar } from '../../../components/WeeklyCalendar';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import { HabitPageStyles } from '../../../components/styles/HabitPageStyles';
import { NewHabitModal } from '../../../components/NewHabitModal';
import { ThemedText } from '../../../components/ThemedText';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { addHabit, getHabitDays, getHabitInterval, getHabitsForDate, updateHabit } from '../../../lib/client';
import HabitPanel, { Habit } from '../../../components/HabitPanel';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * HomeScreen component for viewing, adding, and editing habits for a selected date.
 * Handles habit form logic, validation, and integrates with habit modal and calendar.
 */
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

  // Goal fields (only used by build type)
  const [isGoalEnabled, setIsGoalEnabled] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const { theme } = useTheme();

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditHabit, setCurrentEditHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Validates and submits the habit form.
   * If in edit mode, updates an existing habit. Otherwise, adds a new habit.
   */
  const handleAddHabit = async () => {
    const showAlert = (message: string) => {
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert("Validation Error", message);
      }
    };

    // 1. Validate Habit Name: It must not be empty.
    if (!habitName || habitName.trim() === '') {
      showAlert("Habit name cannot be empty.");
      return;
    }

    // 2. Validate Habit Name Uniqueness: BUT only for new habits or when the name has changed
    if (!isEditMode && dbHabits.some((habit: any) => habit.habitName.toLowerCase() === habitName.trim().toLowerCase())) {
      showAlert("A habit with this name already exists for this user.");
      return;
    }

    // 3. Validate Color: If no color is picked, default to yellow (#FFFF00)
    let chosenColor = habitColor;
    if (!chosenColor || chosenColor.trim() === '') {
      chosenColor = '#FFFF00';
    }

    // 4. If schedule is "interval", ensure intervalDays is a valid number and not negative.
    if (scheduleOption === 'interval') {
      if (!intervalDays || isNaN(parseInt(intervalDays, 10))) {
        showAlert("Please enter a valid number of days for the interval schedule.");
        return;
      }
      if (parseInt(intervalDays, 10) < 0) {
        showAlert("Interval days cannot be negative.");
        return;
      }
    }

    // 5. If schedule is "weekly", ensure at least one day is selected.
    if (scheduleOption === 'weekly') {
      if (!selectedDays || selectedDays.length === 0) {
        showAlert("Please select at least one day for the weekly schedule.");
        return;
      }
    }

    // 6. Validate goal value: if goal is enabled, ensure the goal value is not negative.
    if (isGoalEnabled) {
      if (!goalValue || goalValue.trim() === '') {
        showAlert("Please enter a valid goal value.");
        return;
      }
      if (isNaN(parseFloat(goalValue))) {
        showAlert("Goal value must be a number.");
        return;
      }
      if (parseFloat(goalValue) < 0) {
        showAlert("Goal value cannot be negative.");
        return;
      }
      if (!goalUnit || goalUnit.trim() === '') {
        showAlert("Please enter a unit for your goal.");
        return;
      }
    }

    // Construct the new habit object with validations applied
    const newHabit = {
      email,
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
      // In edit mode: call updateHabit
      // Otherwise: call addHabit
      if (isEditMode && currentEditHabit) {
        const storedEmail = await AsyncStorage.getItem('email');
        if (storedEmail) {
          await updateHabit(storedEmail, newHabit);
        }
      } else {
        await addHabit(newHabit);
      }

      // Refresh the habit list
      await fetchHabits();
    } catch (error) {
      console.error('Error adding/updating habit:', error);
      showAlert("Error saving habit");
      return;
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
    setModalVisible(false);
  };

  const [dbHabits, setDbHabits] = useState<any[]>([]);

  /**
   * Fetches all habits for the selected date from the database.
   * Updates local state with the result.
   */
  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      const dateString = selectedDate.fullDate.toISOString().split('T')[0];
      const habits = await getHabitsForDate(email, dateString);
      setDbHabits(habits);
    } catch (error) {
      console.error('Error fetching habits for selected date:', error);
    } finally {
      setIsLoading(false);
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
    if (email) {
      fetchHabits();
    }
  }, [selectedDate, email]);

  /**
   * Handles loading an existing habit into the form for editing.
   * Also fetches any associated schedule (interval or weekly).
   */
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
      } else {
        const daysResponse = await getHabitDays(email, habit.habitName);
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

  // Refetches the habit list after a habit is deleted
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
        <View style={HabitPageStyles.habitListContainer}>
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
            <Text style={HabitPageStyles.noHabitsText}>
              Press the plus button to add new habits!
            </Text>
          )}
        </View>



        {/* Add Habit Button */}
        <View style={[SharedStyles.addButtonContainer, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={() => {
            // Reset all form fields when opening the modal
            setHabitName('');
            setHabitDescription('');
            setHabitType('build');  // This is a default
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