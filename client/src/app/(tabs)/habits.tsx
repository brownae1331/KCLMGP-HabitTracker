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

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: Date }>({
    date: today.getDate(),
    fullDate: today
  });

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

  const handleAddHabit = () => {
    // Only add goal if "build" type is selected and isGoalEnabled is true
    console.log('New Habit Added:', {
      habitName,
      habitDescription,
      habitType,
      habitColor,
      scheduleOption,
      intervalDays,
      selectedDays,
      goal:
        habitType === 'build' && isGoalEnabled
          ? { goalValue, goalUnit, period: 'per day' }
          : null,
    });

    // Reset form
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
        // Replace 'user@example.com' with the current user's email (or pass it via props/context)
        const habits = await getHabitsByUser('user@example.com');
        // Filter habits by date:
        const filtered = habits.filter((habit: any) => {
          if (!habit.date) return false;
          const habitDate = new Date(habit.date);
          return (
            habitDate.getDate() === selectedDate.fullDate.getDate() &&
            habitDate.getMonth() === selectedDate.fullDate.getMonth() &&
            habitDate.getFullYear() === selectedDate.fullDate.getFullYear()
          );
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
