import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';
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
}

export const ProgressEntry: React.FC<ProgressEntryProps> = ({
    visible,
    onClose,
    habit,
    initialProgress,
    onSave,
}) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState<number>(initialProgress);
    const [progressText, setProgressText] = useState<string>(initialProgress.toString());

    useEffect(() => {
        setProgress(initialProgress);
        setProgressText(initialProgress.toString());
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
    const progressPercentage = habit.habitType === 'build' && habit.goalValue
        ? Math.min(100, (progress / habit.goalValue) * 100)
        : habit.habitType === 'quit'
            ? (progress > 0 ? 100 : 0)
            : Math.min(100, progress);

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                    <ThemedText type="title" style={[styles.title, { color: Colors[theme].text }]}>{habit.habitName}</ThemedText>
                    <ThemedText style={[styles.description, { color: Colors[theme].text }]}>{habit.habitDescription}</ThemedText>

                    <View style={styles.progressContainer}>
                        <CircleProgress
                            percentage={progressPercentage}
                            color={habit.habitColor}
                            size={200}
                        />

                        <View style={styles.progressTextContainer}>
                            <TextInput
                                style={[
                                    styles.progressInput,
                                    { color: Colors[theme].text }
                                ]}
                                value={progressText}
                                onChangeText={handleTextChange}
                                keyboardType="numeric"
                                textAlign="center"
                            />
                            {habit.goalUnit && (
                                <ThemedText style={[styles.unitText, { color: Colors[theme].text }]}>{habit.goalUnit}</ThemedText>
                            )}
                        </View>
                    </View>

                    {/* Goal container with plus/minus buttons */}
                    <View style={styles.goalContainer}>
                        <TouchableOpacity
                            style={[styles.circleButton, { backgroundColor: habit.habitColor }]}
                            onPress={decreaseProgress}
                        >
                            <Text style={styles.buttonText}>-</Text>
                        </TouchableOpacity>

                        {habit.goalValue && (
                            <ThemedText style={[styles.goalText, { color: Colors[theme].text }]}>
                                Goal: {habit.goalValue} {habit.goalUnit}
                            </ThemedText>
                        )}

                        <TouchableOpacity
                            style={[styles.circleButton, { backgroundColor: habit.habitColor }]}
                            onPress={increaseProgress}
                        >
                            <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: habit.habitColor }]}
                        onPress={handleSave}
                    >
                        <ThemedText style={styles.saveButtonText}>Save Progress</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                    >
                        <ThemedText style={{ color: Colors[theme].text }}>Cancel</ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        marginBottom: 24,
        textAlign: 'center',
    },
    progressContainer: {
        position: 'relative',
        width: 200,
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    progressTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    progressInput: {
        fontSize: 28,
        fontWeight: 'bold',
        width: 80,
        height: 50,
        textAlign: 'center',
    },
    unitText: {
        fontSize: 16,
        marginTop: 5,
    },
    goalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginVertical: 20,
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    goalText: {
        fontSize: 18,
        fontWeight: '500',
    },
    saveButton: {
        width: '100%',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 15,
        marginTop: 10,
    },
}); 