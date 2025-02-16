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
import { HabitModalStyles as styles } from './styles/HabitModalStyles';

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

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={SharedStyles.modalOverlay}>
                <View style={SharedStyles.modalContent}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={SharedStyles.scrollContent}
                    >
                        <ThemedText type="title" style={[SharedStyles.modalTitle, SharedStyles.textDark]}>
                            Add New Habit
                        </ThemedText>

                        <HabitTypeSlider habitType={habitType} setHabitType={setHabitType} />

                        <TextInput
                            style={[SharedStyles.input, { color: '#333' }]}
                            placeholder="Habit Name"
                            placeholderTextColor="#777"
                            value={habitName}
                            onChangeText={setHabitName}
                        />

                        <TextInput
                            style={[SharedStyles.input, styles.descriptionInput, { color: '#333' }]}
                            placeholder="Habit Description"
                            placeholderTextColor="#777"
                            value={habitDescription}
                            onChangeText={setHabitDescription}
                            multiline
                        />

                        <ThemedText type="subtitle" style={[SharedStyles.sectionLabel, SharedStyles.textDark]}>
                            Pick a Color
                        </ThemedText>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.colorPickerContainer}
                        >
                            {colorOptions.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: color },
                                        color === habitColor && styles.selectedSwatch,
                                    ]}
                                    onPress={() => setHabitColor(color)}
                                />
                            ))}
                        </ScrollView>

                        {habitType === 'build' && (
                            <>
                                <ThemedText type="subtitle" style={[SharedStyles.sectionLabel, SharedStyles.textDark]}>
                                    Goal
                                </ThemedText>
                                <View style={styles.goalToggleContainer}>
                                    <ThemedText style={[SharedStyles.textDark]}>Enable Goal?</ThemedText>
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
                                            style={[SharedStyles.input, { flex: 0.4, color: '#333' }]}
                                            placeholder="Number"
                                            placeholderTextColor="#777"
                                            keyboardType="numeric"
                                            value={goalValue}
                                            onChangeText={setGoalValue}
                                        />
                                        <TextInput
                                            style={[SharedStyles.input, { flex: 0.6, color: '#333', marginLeft: 8 }]}
                                            placeholder="Unit (e.g. minutes, pages)"
                                            placeholderTextColor="#777"
                                            value={goalUnit}
                                            onChangeText={setGoalUnit}
                                        />
                                        <ThemedText style={[SharedStyles.daysText, SharedStyles.textDark]}>per day</ThemedText>
                                    </View>
                                )}
                            </>
                        )}

                        <ThemedText type="subtitle" style={[SharedStyles.sectionLabel, SharedStyles.textDark]}>
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
                                    style={[SharedStyles.input, { flex: 1, color: '#333' }]}
                                    placeholder="Enter number"
                                    placeholderTextColor="#777"
                                    keyboardType="numeric"
                                    value={intervalDays}
                                    onChangeText={setIntervalDays}
                                />
                                <ThemedText style={[SharedStyles.daysText, SharedStyles.textDark]}>days</ThemedText>
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
                                                SharedStyles.textDark,
                                            ]}
                                        >
                                            {day.slice(0, 3)}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={SharedStyles.button} onPress={onAddHabit}>
                            <ThemedText style={SharedStyles.buttonText}>Add Habit</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[SharedStyles.button, SharedStyles.cancelButton]}
                            onPress={() => setModalVisible(false)}
                        >
                            <ThemedText style={SharedStyles.buttonText}>Cancel</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
