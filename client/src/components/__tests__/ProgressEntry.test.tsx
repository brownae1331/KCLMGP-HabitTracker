import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgressEntry } from '../ProgressEntry';

// Mock the ThemeContext to provide a default theme.
jest.mock('../ThemeContext', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock Colors to return simple color values for the "light" theme.
jest.mock('../styles/Colors', () => ({
    Colors: { light: { background: '#fff', text: '#000' } },
}));

// Mock ProgressEntryStyles to avoid style conflicts.
jest.mock('../styles/ProgressEntryStyles', () => ({
    ProgressEntryStyles: {
        modalOverlay: {},
        container: {},
        title: {},
        description: {},
        progressContainer: {},
        progressTextContainer: {},
        progressInput: {},
        disabledInput: {},
        unitText: {},
        binaryStatusContainer: {},
        binaryStatusText: {},
        binaryControlContainer: {},
        binaryButton: {},
        binaryButtonSelected: {},
        binaryButtonText: {},
        goalContainer: {},
        circleButton: {},
        buttonText: {},
        goalText: {},
        saveButton: {},
        saveButtonText: {},
        readOnlyContainer: {},
        readOnlyText: {},
        cancelButton: {},
    },
}));

// Mock ThemedText to simply render a Text component.
jest.mock('../ThemedText', () => {
    const React = require('react');
    const { Text } = require('react-native');
    return { ThemedText: (props: any) => <Text {...props}>{props.children}</Text> };
});

// Mock CircleProgress to render a view with a testID and show the percentage.
jest.mock('../CircleProgress', () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return {
        CircleProgress: ({ percentage }: { percentage: number; color: string; size: number }) => (
            <View testID="circle-progress">
                <Text>{`percentage: ${percentage}`}</Text>
            </View>
        ),
    };
});

describe('ProgressEntry', () => {
    const habitBuildWithGoal = {
        habitName: 'Test Habit',
        habitDescription: 'Test Description',
        habitType: 'build' as const,
        habitColor: '#FF0000',
        goalValue: 10,
        goalUnit: 'times',
    };

    const habitQuit = {
        habitName: 'Quit Habit',
        habitDescription: 'Quit description',
        habitType: 'quit' as const,
        habitColor: '#00FF00',
    };

    const habitBuildNoGoal = {
        habitName: 'No Goal Habit',
        habitDescription: 'No Goal description',
        habitType: 'build' as const,
        habitColor: '#0000FF',
        goalValue: null,
        goalUnit: 'items',
    };

    it('renders build habit with goal and allows progress adjustments and saving', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByText, getByDisplayValue, getByTestId } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildWithGoal}
                initialProgress={5}
                onSave={onSave}
                isEditable={true}
            />
        );

        // Verify title and description are rendered.
        expect(getByText('Test Habit')).toBeTruthy();
        expect(getByText('Test Description')).toBeTruthy();

        // Verify CircleProgress is rendered with the correct percentage (5/10 * 100 = 50).
        const circleProgress = getByTestId('circle-progress');
        expect(circleProgress).toBeTruthy();
        expect(getByText(/percentage: 50/)).toBeTruthy();

        // Verify that the TextInput is rendered with initial value "5".
        const textInput = getByDisplayValue('5');
        expect(textInput).toBeTruthy();

        // Verify that the goal text is displayed.
        expect(getByText(/Goal: 10 times/)).toBeTruthy();

        // Simulate pressing the increase button ("+").
        const increaseButton = getByText('+');
        fireEvent.press(increaseButton);
        expect(getByDisplayValue('6')).toBeTruthy();

        // Simulate pressing the decrease button ("-").
        const decreaseButton = getByText('-');
        fireEvent.press(decreaseButton);
        expect(getByDisplayValue('5')).toBeTruthy();

        // Simulate changing the text input to a valid number "8".
        fireEvent.changeText(textInput, '8');
        expect(getByDisplayValue('8')).toBeTruthy();

        // Simulate entering an invalid number "abc".
        fireEvent.changeText(textInput, 'abc');
        expect(getByDisplayValue('abc')).toBeTruthy();
        // The internal progress state should remain at the last valid number (8).

        // Simulate pressing the save button.
        const saveButton = getByText('Save Progress');
        fireEvent.press(saveButton);
        // onSave should be called with 8 (the last valid progress) and onClose should be called.
        expect(onSave).toHaveBeenCalledWith(8);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders quit habit with binary controls and allows toggling and saving', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByText, queryByTestId } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitQuit}
                initialProgress={0}
                onSave={onSave}
                isEditable={true}
            />
        );

        // For quit habits, binary controls are used; CircleProgress should not be rendered.
        expect(queryByTestId('circle-progress')).toBeNull();

        // Verify the initial binary status is "Not Completed".
        expect(getByText('Status: Not Completed')).toBeTruthy();

        // Simulate pressing the "Completed" button.
        const completedButton = getByText('Completed');
        fireEvent.press(completedButton);
        expect(getByText('Status: Completed')).toBeTruthy();

        // Simulate pressing the "Not Completed" button.
        const notCompletedButton = getByText('Not Completed');
        fireEvent.press(notCompletedButton);
        expect(getByText('Status: Not Completed')).toBeTruthy();

        // Simulate pressing the save button.
        const saveButton = getByText('Save Progress');
        fireEvent.press(saveButton);
        // onSave should be called with 0 (current progress) and onClose should be called.
        expect(onSave).toHaveBeenCalledWith(0);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders read-only mode correctly', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByText, queryByText } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildWithGoal}
                initialProgress={3}
                onSave={onSave}
                isEditable={false}
            />
        );

        // In read-only mode for a build habit with a goal, the progress text is displayed.
        expect(getByText(/Progress: 3 times/)).toBeTruthy();

        // The save button should not be rendered.
        expect(queryByText('Save Progress')).toBeNull();

        // The cancel button should display "Close" instead of "Cancel".
        const cancelButton = getByText('Close');
        fireEvent.press(cancelButton);
        expect(onClose).toHaveBeenCalled();
    });

    it('renders build habit without goal using binary controls', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByText, queryByTestId } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildNoGoal}
                initialProgress={0}
                onSave={onSave}
                isEditable={true}
            />
        );

        // For build habits without a goal, binary controls are used; CircleProgress should not be rendered.
        expect(queryByTestId('circle-progress')).toBeNull();
        expect(getByText('Status: Not Completed')).toBeTruthy();

        // Simulate pressing the "Completed" button.
        const completedButton = getByText('Completed');
        fireEvent.press(completedButton);
        expect(getByText('Status: Completed')).toBeTruthy();

        // Simulate pressing the save button.
        const saveButton = getByText('Save Progress');
        fireEvent.press(saveButton);
        // onSave should be called with 1 after pressing "Completed".
        expect(onSave).toHaveBeenCalledWith(1);
        expect(onClose).toHaveBeenCalled();
    });

    it('updates progress when initialProgress and visible change', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByDisplayValue, rerender } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildWithGoal}
                initialProgress={5}
                onSave={onSave}
                isEditable={true}
            />
        );

        // Verify initial progress is "5".
        expect(getByDisplayValue('5')).toBeTruthy();

        // Rerender the component with a new initialProgress value.
        rerender(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildWithGoal}
                initialProgress={7}
                onSave={onSave}
                isEditable={true}
            />
        );

        // The TextInput should update to "7" due to the useEffect dependency.
        expect(getByDisplayValue('7')).toBeTruthy();
    });

    it('does not allow progress to go below 0', () => {
        const onClose = jest.fn();
        const onSave = jest.fn();

        const { getByText, getByDisplayValue } = render(
            <ProgressEntry
                visible={true}
                onClose={onClose}
                habit={habitBuildWithGoal}
                initialProgress={0}
                onSave={onSave}
                isEditable={true}
            />
        );

        // Press the decrease ("-") button.
        const decreaseButton = getByText('-');
        fireEvent.press(decreaseButton);

        // The TextInput should still display "0" because progress cannot go below zero.
        expect(getByDisplayValue('0')).toBeTruthy();
    });
});
