import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';
import { ProgressEntryStyles } from './styles/ProgressEntryStyles';
import { CircleProgress } from './CircleProgress';

interface ProgressEntryProps {
    visible: boolean;
    onClose: () => void;
    habit: {
        habitName: string;
        habitDescription: string;
        habitType: 'build' | 'quit';
        habitColor: string;
        goalValue?: number | null;
        goalUnit?: string;
    };
    initialProgress: number;
    onSave: (progress: number) => void;
    isEditable?: boolean;
}

export const ProgressEntry: React.FC<ProgressEntryProps> = ({
    visible,
    onClose,
    habit,
    initialProgress,
    onSave,
    isEditable = true,
}) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState<number>(initialProgress);
    const [progressText, setProgressText] = useState<string>(
        initialProgress !== undefined ? initialProgress.toString() : '0'
    );

    useEffect(() => {
        setProgress(initialProgress || 0);
        setProgressText(initialProgress !== undefined ? initialProgress.toString() : '0');
    }, [initialProgress, visible]);

    const increaseProgress = () => {
        const newProgress = progress + 1;
        setProgress(newProgress);
        setProgressText(newProgress.toString());
    };

    const decreaseProgress = () => {
        const newProgress = Math.max(0, progress - 1);
        setProgress(newProgress);
        setProgressText(newProgress.toString());
    };

    const handleTextChange = (text: string) => {
        setProgressText(text);
        const numValue = parseFloat(text);
        if (!isNaN(numValue)) {
            setProgress(numValue);
        }
    };

    const handleSave = () => {
        const numValue = parseFloat(progressText);
        if (!isNaN(numValue)) {
            onSave(numValue);
        } else {
            onSave(progress);
        }
        onClose();
    };

    // Calculate progress percentage for the circle
    const progressPercentage = useMemo(() => {
        const isBuildWithoutGoal = habit.habitType === 'build' &&
            (habit.goalValue === undefined || habit.goalValue === null);

        if (habit.habitType === 'build' && !isBuildWithoutGoal && habit.goalValue) {
            // Build habit with a goal: show percentage to goal
            return Math.min(100, (progress / habit.goalValue) * 100);
        } else {
            // Quit habit or build habit without a goal: binary progress
            return progress > 0 ? 100 : 0;
        }
    }, [habit, progress]);

    // Determine if this is a build habit without a goal
    const isBuildWithoutGoal = habit.habitType === 'build' &&
        (habit.goalValue === undefined || habit.goalValue === null);

    // Use binary controls for quit habits and build habits without goals
    const useBinaryControls = habit.habitType === 'quit' || isBuildWithoutGoal;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={ProgressEntryStyles.modalOverlay}>
                <View style={[ProgressEntryStyles.container, { backgroundColor: Colors[theme].background }]}>
                    <ThemedText type="title" style={[ProgressEntryStyles.title, { color: Colors[theme].text }]}>{habit.habitName}</ThemedText>
                    <ThemedText style={[ProgressEntryStyles.description, { color: Colors[theme].text }]}>{habit.habitDescription}</ThemedText>

                    {/* Only show progress circle for build habits with goals */}
                    {!useBinaryControls && (
                        <View style={ProgressEntryStyles.progressContainer}>
                            <CircleProgress
                                percentage={progressPercentage}
                                color={habit.habitColor}
                                size={200}
                            />

                            <View style={ProgressEntryStyles.progressTextContainer}>
                                <TextInput
                                    style={[
                                        ProgressEntryStyles.progressInput,
                                        { color: Colors[theme].text },
                                        !isEditable && ProgressEntryStyles.disabledInput
                                    ]}
                                    value={progressText}
                                    onChangeText={handleTextChange}
                                    keyboardType="numeric"
                                    textAlign="center"
                                    editable={isEditable}
                                />
                                {habit.goalUnit && (
                                    <ThemedText style={[ProgressEntryStyles.unitText, { color: Colors[theme].text }]}>{habit.goalUnit}</ThemedText>
                                )}
                            </View>
                        </View>
                    )}

                    {/* For binary habits, show completion status */}
                    {useBinaryControls && (
                        <View style={[ProgressEntryStyles.binaryStatusContainer, { borderColor: habit.habitColor }]}>
                            <ThemedText style={[ProgressEntryStyles.binaryStatusText, { color: Colors[theme].text }]}>
                                Status: {progress > 0 ? 'Completed' : 'Not Completed'}
                            </ThemedText>
                        </View>
                    )}

                    {isEditable ? (
                        <>
                            {useBinaryControls ? (
                                <View style={ProgressEntryStyles.binaryControlContainer}>
                                    <TouchableOpacity
                                        style={[
                                            ProgressEntryStyles.binaryButton,
                                            progress > 0 && ProgressEntryStyles.binaryButtonSelected,
                                            { backgroundColor: progress > 0 ? habit.habitColor : 'rgba(0,0,0,0.1)' }
                                        ]}
                                        onPress={() => {
                                            setProgress(1);
                                            setProgressText("1");
                                        }}
                                    >
                                        <Text style={ProgressEntryStyles.binaryButtonText}>Completed</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            ProgressEntryStyles.binaryButton,
                                            progress === 0 && ProgressEntryStyles.binaryButtonSelected,
                                            { backgroundColor: progress === 0 ? habit.habitColor : 'rgba(0,0,0,0.1)' }
                                        ]}
                                        onPress={() => {
                                            setProgress(0);
                                            setProgressText("0");
                                        }}
                                    >
                                        <Text style={ProgressEntryStyles.binaryButtonText}>Not Completed</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={ProgressEntryStyles.goalContainer}>
                                    <TouchableOpacity
                                        style={[ProgressEntryStyles.circleButton, { backgroundColor: habit.habitColor }]}
                                        onPress={decreaseProgress}
                                    >
                                        <Text style={ProgressEntryStyles.buttonText}>-</Text>
                                    </TouchableOpacity>

                                    {habit.goalValue && (
                                        <ThemedText style={[ProgressEntryStyles.goalText, { color: Colors[theme].text }]}>
                                            Goal: {habit.goalValue} {habit.goalUnit}
                                        </ThemedText>
                                    )}

                                    <TouchableOpacity
                                        style={[ProgressEntryStyles.circleButton, { backgroundColor: habit.habitColor }]}
                                        onPress={increaseProgress}
                                    >
                                        <Text style={ProgressEntryStyles.buttonText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[ProgressEntryStyles.saveButton, { backgroundColor: habit.habitColor }]}
                                onPress={handleSave}
                            >
                                <ThemedText style={ProgressEntryStyles.saveButtonText}>Save Progress</ThemedText>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={ProgressEntryStyles.readOnlyContainer}>
                            {/* Only show progress text for non-binary habits */}
                            {!useBinaryControls && (
                                <ThemedText style={[ProgressEntryStyles.readOnlyText, { color: Colors[theme].text }]}>
                                    Progress: {progress} {habit.goalUnit || ''}
                                    {habit.goalValue && ` / ${habit.goalValue} ${habit.goalUnit || ''}`}
                                </ThemedText>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={ProgressEntryStyles.cancelButton}
                        onPress={onClose}
                    >
                        <ThemedText style={{ color: Colors[theme].text }}>
                            {isEditable ? 'Cancel' : 'Close'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
