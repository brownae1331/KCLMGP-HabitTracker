import React, { useEffect } from 'react';
import {
  Modal,
  TouchableOpacity,
  TextInput,
  View,
  ScrollView,
  Switch,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { Picker } from '@react-native-picker/picker';
import { HabitTypeSlider } from './HabitTypeSlider';
import { SharedStyles } from './styles/SharedStyles';
import { HabitModalStyles } from './styles/HabitModalStyles';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';

interface NewHabitModalProps {
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  habitName: string;
  setHabitName: (name: string) => void;
  habitDescription: string;
  setHabitDescription: (description: string) => void;
  habitType: 'build' | 'quit';
  setHabitType: (type: 'build' | 'quit') => void;
  habitColor: string;
  setHabitColor: (color: string) => void;
  scheduleOption: 'interval' | 'weekly';
  setScheduleOption: (option: 'interval' | 'weekly') => void;
  intervalDays: string;
  setIntervalDays: (days: string) => void;
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
  isGoalEnabled: boolean;
  setIsGoalEnabled: (enabled: boolean) => void;
  goalValue: string;
  setGoalValue: (value: string) => void;
  goalUnit: string;
  setGoalUnit: (unit: string) => void;
  onAddHabit: () => void;
  isEditMode?: boolean;
}

const colorOptions = [
  '#FF0000', // Red
  '#FF9500', // Orange
  '#FFCC00', // Yellow
  '#34C759', // Green
  '#007AFF', // Blue
  '#AF52DE', // Purple
  '#8E8E93', // Gray
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const NewHabitModal: React.FC<NewHabitModalProps> = ({
  modalVisible,
  setModalVisible,
  habitName,
  setHabitName,
  habitDescription,
  setHabitDescription,
  habitType,
  setHabitType,
  habitColor,
  setHabitColor,
  scheduleOption,
  setScheduleOption,
  intervalDays,
  setIntervalDays,
  selectedDays,
  setSelectedDays,
  isGoalEnabled,
  setIsGoalEnabled,
  goalValue,
  setGoalValue,
  goalUnit,
  setGoalUnit,
  onAddHabit,
  isEditMode = false,
}) => {
  // Get the color to use (selected color or default)
  const getActiveColor = () =>
    habitColor && habitColor.trim() !== '' ? habitColor : '#a39d41';

  const toggleDay = (day: string) => {
    console.log(selectedDays);
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const { theme } = useTheme();

  useEffect(() => {
    if (modalVisible && !isEditMode) {
      // Reset form values when opening for a new habit
      setHabitName('');
      setHabitDescription('');
      setHabitColor('');
      setIntervalDays('');
      setSelectedDays([]);
      setGoalValue('');
      setGoalUnit('');
    }
  }, [modalVisible, isEditMode]);

  return (
    <Modal
      testID="newHabitModal"
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={HabitModalStyles.modalOverlay}>
        <View style={[HabitModalStyles.modalContent, { backgroundColor: Colors[theme].background }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
            <ThemedText type="title" style={{ color: Colors[theme].text }}>
              {isEditMode ? 'Edit Habit' : 'Add New Habit'}
            </ThemedText>

            <HabitTypeSlider
              habitType={habitType}
              setHabitType={setHabitType}
              activeColor={getActiveColor()}
            />

            <TextInput
              style={[
                SharedStyles.input,
                {
                  color: Colors[theme].text,
                  backgroundColor: isEditMode ? Colors[theme].background2 : Colors[theme].background,
                },
              ]}
              placeholder="Habit Name"
              placeholderTextColor={Colors[theme].placeholder}
              value={habitName}
              onChangeText={setHabitName}
              editable={!isEditMode}
            />

            <TextInput
              style={[SharedStyles.input, HabitModalStyles.descriptionInput, { color: Colors[theme].text }]}
              placeholder="Habit Description"
              placeholderTextColor={Colors[theme].placeholder}
              value={habitDescription}
              onChangeText={setHabitDescription}
              multiline
            />

            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
              Select a Color
            </ThemedText>

            <TextInput
              style={[SharedStyles.input, { color: Colors[theme].text }]}
              placeholder="#ffCC00"
              placeholderTextColor={Colors[theme].placeholder}
              value={habitColor}
              onChangeText={setHabitColor}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  testID={`color-swatch-${color}`}
                  key={color}
                  style={[
                    HabitModalStyles.colorSwatch,
                    { backgroundColor: color },
                    color === habitColor && [
                      HabitModalStyles.selectedSwatch,
                      { borderColor: getActiveColor() },
                    ],
                  ]}
                  onPress={() => setHabitColor(color)}
                />
              ))}
            </ScrollView>

            {habitType === 'build' && (
              <>
                <View style={HabitModalStyles.goalToggleContainer}>
                  <ThemedText style={{ color: Colors[theme].text }}>Select a Goal</ThemedText>
                  <Switch
                    value={isGoalEnabled}
                    onValueChange={setIsGoalEnabled}
                    trackColor={{ false: '#ccc', true: getActiveColor() }}
                    thumbColor="#fff"
                  />
                </View>
                {isGoalEnabled && (
                  <View style={HabitModalStyles.goalFieldsContainer}>
                    <TextInput
                      style={[SharedStyles.input, { flex: 0.6, color: Colors[theme].text }]}
                      placeholder="Number"
                      placeholderTextColor={Colors[theme].placeholder}
                      keyboardType="numeric"
                      value={goalValue}
                      onChangeText={setGoalValue}
                    />
                    <TextInput
                      style={[SharedStyles.input, { flex: 0.4, color: Colors[theme].text, marginLeft: 8 }]}
                      placeholder="Unit (e.g. minutes, pages)"
                      placeholderTextColor={Colors[theme].placeholder}
                      value={goalUnit}
                      onChangeText={setGoalUnit}
                    />
                    <ThemedText style={{ color: Colors[theme].text, marginLeft: 8 }}>per day</ThemedText>
                  </View>
                )}
              </>
            )}

            <ThemedText type="subtitle" style={{ color: Colors[theme].text, marginBottom: 8 }}>
              Schedule
            </ThemedText>
            <Picker
              mode="dropdown"
              selectedValue={scheduleOption}
              onValueChange={(itemValue) => setScheduleOption(itemValue)}
              style={[HabitModalStyles.picker, { backgroundColor: Colors[theme].background, color: Colors[theme].text }]}
              dropdownIconColor={Colors[theme].text}
            >
              <Picker.Item label="Every ___ days" value="interval" color={Colors[theme].text} />
              <Picker.Item label="Every ___ day of the week" value="weekly" color={Colors[theme].text} />
            </Picker>

            {scheduleOption === 'interval' ? (
              <View style={HabitModalStyles.intervalContainer}>
                <TextInput
                  style={[SharedStyles.input, { flex: 1, color: Colors[theme].text }]}
                  placeholder="Enter number"
                  placeholderTextColor={Colors[theme].placeholder}
                  keyboardType="numeric"
                  value={intervalDays}
                  onChangeText={setIntervalDays}
                />
                <ThemedText style={{ color: Colors[theme].text, marginLeft: 8 }}>days</ThemedText>
              </View>
            ) : (
              <View style={[HabitModalStyles.weeklyContainer, { padding: 16 }]}>
                {daysOfWeek.map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      HabitModalStyles.dayButton,
                      selectedDays.includes(day) && [
                        HabitModalStyles.selectedDayButton,
                        { backgroundColor: getActiveColor() },
                      ],
                    ]}
                  >
                    <ThemedText
                      style={[
                        HabitModalStyles.dayButtonText,
                        selectedDays.includes(day) && HabitModalStyles.selectedDayButtonText,
                      ]}
                    >
                      {day.slice(0, 3)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[HabitModalStyles.buttonContainer, { backgroundColor: Colors[theme].background }]}>
            <TouchableOpacity
              style={[
                SharedStyles.button,
                {
                  borderColor: getActiveColor(),
                  backgroundColor: getActiveColor(),
                },
              ]}
              onPress={onAddHabit}
            >
              <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
                {isEditMode ? 'Edit Habit' : 'Add Habit'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[SharedStyles.button, { backgroundColor: '#CCCCCC' }]}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].text }}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
