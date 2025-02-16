import React, { useState } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Text,
} from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { SharedStyles } from '../../components/styles/SharedStyles';
import { NewHabitModal } from '../../components/NewHabitModal';

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

  return (
    <SafeAreaView style={SharedStyles.container}>
      <ScrollView style={{ flex: 1 }}>

        {/* Today/Selected Date */}
        <Text style={SharedStyles.selectedDateText}>
          {selectedDate.date === today.getDate()
            ? "Today"
            : selectedDate.fullDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
        </Text>

        {/* Weekly Calendar */}
        <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {/* Add Habit Button */}
        <ThemedView style={SharedStyles.addButtonContainer}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus" size={24} color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>

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

