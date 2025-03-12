import React from 'react';
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
}) => {
    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter((d) => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const { theme } = useTheme();

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={HabitModalStyles.modalOverlay}>
                <View style={[HabitModalStyles.modalContent, { backgroundColor: Colors[theme].background }]}>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
                        <ThemedText type="title" style={{ color: Colors[theme].text }}>
                            Add New Habit
                        </ThemedText>

                        <HabitTypeSlider habitType={habitType} setHabitType={setHabitType} />

                        <TextInput
                            style={[SharedStyles.input, { color: Colors[theme].text }]}
                            placeholder="Habit Name"
                            placeholderTextColor="#777"
                            value={habitName}
                            onChangeText={setHabitName}
                        />

                        <TextInput
                            style={[SharedStyles.input, HabitModalStyles.descriptionInput, { color: Colors[theme].text }]}
                            placeholder="Habit Description"
                            placeholderTextColor="#777"
                            value={habitDescription}
                            onChangeText={setHabitDescription}
                            multiline
                        />

                        <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                            Pick a Color
                        </ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
                            {colorOptions.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[HabitModalStyles.colorSwatch, { backgroundColor: color }, color === habitColor && HabitModalStyles.selectedSwatch,]}
                                    onPress={() => setHabitColor(color)}
                                />
                            ))}
                        </ScrollView>

                        {habitType === 'build' && (
                            <>
                                <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                                    Goal
                                </ThemedText>
                                <View style={HabitModalStyles.goalToggleContainer}>
                                    <ThemedText style={{ color: Colors[theme].text }}>Enable Goal?</ThemedText>
                                    <Switch
                                        value={isGoalEnabled}
                                        onValueChange={setIsGoalEnabled}
                                        trackColor={{ false: '#ccc', true: '#007AFF' }}
                                        thumbColor="#fff"
                                    />
                                </View>
                                {isGoalEnabled && (
                                    <View style={HabitModalStyles.goalFieldsContainer}>
                                        <TextInput
                                            style={[SharedStyles.input, { flex: 0.6, color: '#777' }]}
                                            placeholder="Number"
                                            placeholderTextColor="#777"
                                            keyboardType="numeric"
                                            value={goalValue}
                                            onChangeText={setGoalValue}
                                        />
                                        <TextInput
                                            style={[SharedStyles.input, { flex: 0.4, color: '#777', marginLeft: 8 }]}
                                            placeholder="Unit (e.g. minutes, pages)"
                                            placeholderTextColor="#777"
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
                                    style={[SharedStyles.input, { flex: 1, color: '#777' }]}
                                    placeholder="Enter number"
                                    placeholderTextColor="#777"
                                    keyboardType="numeric"
                                    value={intervalDays}
                                    onChangeText={setIntervalDays}
                                />
                                <ThemedText style={{ color: Colors[theme].text, marginLeft: 8 }}>days</ThemedText>
                            </View>
                        ) : (
                            <View style={HabitModalStyles.weeklyContainer}>
                                {daysOfWeek.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        onPress={() => toggleDay(day)}
                                        style={[
                                            HabitModalStyles.dayButton,
                                            selectedDays.includes(day) && HabitModalStyles.selectedDayButton,
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
                        <TouchableOpacity style={SharedStyles.button} onPress={onAddHabit}>
                            <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].text }}>Add Habit</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[SharedStyles.button, { backgroundColor: '#CCCCCC' }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <ThemedText type="defaultSemiBold" style={{ color: Colors[theme].text }}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
