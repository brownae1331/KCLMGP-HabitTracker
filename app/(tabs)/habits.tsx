import React, { useState } from 'react';
import {
  StyleSheet,
  Platform,
  Modal,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Picker } from '@react-native-picker/picker';

export default function HomeScreen() {
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
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Goal fields (only relevant for build type)
  const [isGoalEnabled, setIsGoalEnabled] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');

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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title" style={styles.textDark}>
            Habits
          </ThemedText>
        </ThemedView>

        {/* Add Habit Button */}
        <ThemedView style={styles.addButtonContainer}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus" size={24} color="#007AFF" />
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* Modal for Adding a New Habit */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="title" style={[styles.modalTitle, styles.textDark]}>
              Add New Habit
            </ThemedText>

            {/* Habit Type Slider */}
            <HabitTypeSlider habitType={habitType} setHabitType={setHabitType} />

            {/* Habit Name Input */}
            <TextInput
              style={[styles.input, { color: '#333' }]}
              placeholder="Habit Name"
              placeholderTextColor="#777"
              value={habitName}
              onChangeText={setHabitName}
            />

            {/* Habit Description Input (multi-line) */}
            <TextInput
              style={[styles.input, styles.descriptionInput, { color: '#333' }]}
              placeholder="Habit Description"
              placeholderTextColor="#777"
              value={habitDescription}
              onChangeText={setHabitDescription}
              multiline
            />

            {/* Color Picker */}
            <ThemedText type="subtitle" style={[styles.sectionLabel, styles.textDark]}>
              Pick a Color
            </ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.colorPickerContainer}
            >
              {colorOptions.map((color) => {
                const selected = color === habitColor;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      selected && styles.selectedSwatch,
                    ]}
                    onPress={() => setHabitColor(color)}
                  />
                );
              })}
            </ScrollView>

            {/* Goal Section (only visible if habitType is build) */}
            {habitType === 'build' && (
              <>
                <ThemedText type="subtitle" style={[styles.sectionLabel, styles.textDark]}>
                  Goal
                </ThemedText>
                <View style={styles.goalToggleContainer}>
                  <ThemedText style={[styles.textDark]}>
                    Enable Goal?
                  </ThemedText>
                  <Switch
                    value={isGoalEnabled}
                    onValueChange={setIsGoalEnabled}
                    trackColor={{ false: '#ccc', true: '#007AFF' }}
                    thumbColor="#fff"
                  />
                </View>
                {isGoalEnabled && (
                  <View style={styles.goalFieldsContainer}>
                    <TextInput
                      style={[styles.input, { flex: 0.4, color: '#333' }]}
                      placeholder="Number"
                      placeholderTextColor="#777"
                      keyboardType="numeric"
                      value={goalValue}
                      onChangeText={setGoalValue}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        { flex: 0.6, color: '#333', marginLeft: 8 },
                      ]}
                      placeholder="Unit (e.g. minutes, pages)"
                      placeholderTextColor="#777"
                      value={goalUnit}
                      onChangeText={setGoalUnit}
                    />
                    <ThemedText style={[styles.daysText, styles.textDark]}>
                      per day
                    </ThemedText>
                  </View>
                )}
              </>
            )}

            {/* Scheduling Options */}
            <ThemedText type="subtitle" style={[styles.sectionLabel, styles.textDark]}>
              Schedule
            </ThemedText>
            <Picker
              mode="dropdown"
              selectedValue={scheduleOption}
              onValueChange={(itemValue) => setScheduleOption(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Every ___ days" value="interval" />
              <Picker.Item label="Every ___ day of the week" value="weekly" />
            </Picker>

            {scheduleOption === 'interval' ? (
              <View style={styles.intervalContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, color: '#333' }]}
                  placeholder="Enter number"
                  placeholderTextColor="#777"
                  keyboardType="numeric"
                  value={intervalDays}
                  onChangeText={setIntervalDays}
                />
                <ThemedText style={[styles.daysText, styles.textDark]}>
                  days
                </ThemedText>
              </View>
            ) : (
              <View style={styles.weeklyContainer}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayButton,
                      selectedDays.includes(day) && styles.selectedDayButton,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dayButtonText,
                        selectedDays.includes(day) && styles.selectedDayButtonText,
                        styles.textDark,
                      ]}
                    >
                      {day.slice(0, 3)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleAddHabit}>
                <ThemedText style={styles.buttonText}>Add Habit</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Slider Component (unchanged) */
interface HabitTypeSliderProps {
  habitType: 'build' | 'quit';
  setHabitType: (value: 'build' | 'quit') => void;
}

const HabitTypeSlider: React.FC<HabitTypeSliderProps> = ({
  habitType,
  setHabitType,
}) => {
  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        style={[
          styles.sliderOption,
          habitType === 'build' && styles.selectedOption,
        ]}
        onPress={() => setHabitType('build')}
      >
        <ThemedText
          style={[
            styles.sliderOptionText,
            habitType === 'build' && styles.selectedOptionText,
            styles.textDark,
          ]}
        >
          Build
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sliderOption,
          habitType === 'quit' && styles.selectedOption,
        ]}
        onPress={() => setHabitType('quit')}
      >
        <ThemedText
          style={[
            styles.sliderOptionText,
            habitType === 'quit' && styles.selectedOptionText,
            styles.textDark,
          ]}
        >
          Quit
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  textDark: {
    color: '#333333',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  descriptionInput: {
    // Give a bit more room for multiline text
    height: 60,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 25,
    overflow: 'hidden',
  },
  sliderOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  sliderOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  sectionLabel: {
    marginBottom: 4,
    fontWeight: '500',
  },
  picker: {
    width: '100%',
    backgroundColor: '#000',
    marginBottom: 0,
    color: '#333333',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysText: {
    marginLeft: 8,
  },
  weeklyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    margin: 4,
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    color: '#007AFF',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
  },
  // Horizontal scroll container for color swatches
  colorPickerContainer: {
    paddingVertical: 8,
  },
  // Individual color swatch
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Highlight the chosen color
  selectedSwatch: {
    borderColor: '#007AFF',
  },
  // Goal Section
  goalToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  goalFieldsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
});
