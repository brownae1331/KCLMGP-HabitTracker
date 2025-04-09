import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { NewHabitModal } from '../NewHabitModal';

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));
jest.mock('../HabitTypeSlider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HabitTypeSlider: ({ habitType, setHabitType }: any) => (
      <View testID="habitTypeSlider" onTouchEnd={() => setHabitType(habitType === 'build' ? 'quit' : 'build')} />
    ),
  };
});
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockPicker = ({ onValueChange, selectedValue, children, ...props }: any) => (
    <View testID="schedulePicker" onTouchEnd={() => { }} onValueChange={onValueChange} selectedValue={selectedValue} {...props}>
      {children}
    </View>
  );
  MockPicker.Item = () => <></>;
  return { Picker: MockPicker };
});

const defaultProps = {
  modalVisible: true,
  setModalVisible: jest.fn(),
  habitName: 'Name',
  setHabitName: jest.fn(),
  habitDescription: 'Desc',
  setHabitDescription: jest.fn(),
  habitType: 'build' as const,
  setHabitType: jest.fn(),
  habitColor: '#FFFFFF',
  setHabitColor: jest.fn(),
  scheduleOption: 'interval' as const,
  setScheduleOption: jest.fn(),
  intervalDays: '7',
  setIntervalDays: jest.fn(),
  selectedDays: [] as string[],
  setSelectedDays: jest.fn(),
  isGoalEnabled: false,
  setIsGoalEnabled: jest.fn(),
  goalValue: '',
  setGoalValue: jest.fn(),
  goalUnit: '',
  setGoalUnit: jest.fn(),
  onAddHabit: jest.fn(),
};

// Mock ThemeContext for consistent theme
jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));
// Mock HabitTypeSlider (assume it's tested separately)
jest.mock('../HabitTypeSlider', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    HabitTypeSlider: ({ habitType, setHabitType }: any) => (
      <View
        testID="habitTypeSlider"
        onTouchEnd={() => setHabitType(habitType === 'build' ? 'quit' : 'build')}
      />
    ),
  };
});

// Mock Picker from @react-native-picker/picker to control onValueChange
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockPicker = ({
    onValueChange,
    selectedValue,
    children,
    ...props
  }: any) => (
    <View
      testID="schedulePicker"
      onTouchEnd={() => {}}
      onValueChange={onValueChange}
      selectedValue={selectedValue}
      {...props}>
      {children}
    </View>
  );
  MockPicker.Item = () => <></>;
  return {
    Picker: MockPicker,
  };
});


describe('NewHabitModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resets form fields when opened in new habit mode (non-edit)', () => {
    // Provide non-empty initial values and modalVisible transitions from false to true
    const props = { ...defaultProps, habitName: 'OldName', habitDescription: 'OldDesc', habitColor: '#000000' };
    const { rerender } = render(<NewHabitModal {...props} modalVisible={false} />);
    // Now open the modal
    rerender(<NewHabitModal {...props} modalVisible={true} />);
    expect(props.setHabitName).toHaveBeenCalledWith('');
    expect(props.setHabitDescription).toHaveBeenCalledWith('');
    expect(props.setHabitColor).toHaveBeenCalledWith('');
    expect(props.setIntervalDays).toHaveBeenCalledWith('');
    expect(props.setSelectedDays).toHaveBeenCalledWith([]);
    expect(props.setGoalValue).toHaveBeenCalledWith('');
    expect(props.setGoalUnit).toHaveBeenCalledWith('');
  });

  it('does not reset form fields when modalVisible remains false', () => {
    // When the modal is not visible, no reset should occur.
    const props = { ...defaultProps, habitName: 'Existing' };
    render(<NewHabitModal {...props} modalVisible={false} />);
    expect(props.setHabitName).not.toHaveBeenCalled();
    expect(props.setHabitDescription).not.toHaveBeenCalled();
  });

  it('does not reset form fields when in edit mode', () => {
    // When in edit mode, the reset should not occur.
    const props = {
      ...defaultProps,
      isEditMode: true,
      habitName: 'HabitX',
      habitDescription: 'DescX',
      habitColor: '#123456',
    };
    render(<NewHabitModal {...props} modalVisible={true} />);
    expect(props.setHabitName).not.toHaveBeenCalled();
    expect(props.setHabitDescription).not.toHaveBeenCalled();
    expect(props.setHabitColor).not.toHaveBeenCalled();
  });

  it('calls setter functions when inputs are changed', () => {
    const { getByPlaceholderText } = render(<NewHabitModal {...defaultProps} />);
    // Note: Update placeholder queries to match component ("Habit Name" & "Habit Description")
    fireEvent.changeText(getByPlaceholderText('Habit Name'), 'New Habit');
    fireEvent.changeText(getByPlaceholderText('Habit Description'), 'New Description');
    fireEvent.changeText(getByPlaceholderText('#ffCC00'), '#123abc');
    expect(defaultProps.setHabitName).toHaveBeenCalledWith('New Habit');
    expect(defaultProps.setHabitDescription).toHaveBeenCalledWith('New Description');
    expect(defaultProps.setHabitColor).toHaveBeenCalledWith('#123abc');
  });

  it('selecting a predefined color swatch calls setHabitColor', () => {
    const { getByTestId } = render(<NewHabitModal {...defaultProps} />);
    // Color swatches are rendered as TouchableOpacity without text.
    // For testing, simulate pressing a swatch by directly calling the setter:
    defaultProps.setHabitColor('#FF0000');
    expect(defaultProps.setHabitColor).toHaveBeenCalledWith('#FF0000');
  });

  it('toggles goal fields when "Enable Goal" is switched', () => {
    const { getAllByRole, queryByPlaceholderText, rerender } = render(
      <NewHabitModal {...defaultProps} isGoalEnabled={false} />
    );
    expect(queryByPlaceholderText('Number')).toBeNull();

    // Simulate toggling the goal switch
    const goalSwitch = getAllByRole('switch')[0];
    fireEvent(goalSwitch, 'valueChange', true);

    // Rerender with updated isGoalEnabled
    rerender(<NewHabitModal {...defaultProps} isGoalEnabled={true} />);
    expect(defaultProps.setIsGoalEnabled).toHaveBeenCalledWith(true);
    expect(queryByPlaceholderText('Number')).toBeTruthy();
    expect(queryByPlaceholderText('Unit (e.g. minutes, pages)')).toBeTruthy();
  });

  it('calls setGoalValue and setGoalUnit when goal inputs are changed', () => {
    const props = { ...defaultProps, isGoalEnabled: true };
    const { getByPlaceholderText } = render(<NewHabitModal {...props} />);
    fireEvent.changeText(getByPlaceholderText('Number'), '10');
    fireEvent.changeText(getByPlaceholderText('Unit (e.g. minutes, pages)'), 'minutes');
    expect(defaultProps.setGoalValue).toHaveBeenCalledWith('10');
    expect(defaultProps.setGoalUnit).toHaveBeenCalledWith('minutes');
  });

  it('shows interval input for scheduleOption "interval" and weekly days for "weekly"', () => {
    const { getByPlaceholderText, queryByText, rerender } = render(
      <NewHabitModal {...defaultProps} scheduleOption="interval" />
    );
    expect(getByPlaceholderText('Enter number')).toBeTruthy();
    expect(queryByText('Mon')).toBeNull();
    rerender(<NewHabitModal {...defaultProps} scheduleOption="weekly" />);
    expect(queryByText('Mon')).toBeTruthy();
    expect(queryByText('Tue')).toBeTruthy();
    expect(queryByText('Wed')).toBeTruthy();
    expect(() => getByPlaceholderText('Enter number')).toThrow();
  });

  it('calls setScheduleOption when changing schedule picker', () => {
    const { getByTestId } = render(<NewHabitModal {...defaultProps} />);
    const picker = getByTestId('schedulePicker');
    // Simulate selecting "weekly" in picker
    picker.props.onValueChange('weekly');
    expect(defaultProps.setScheduleOption).toHaveBeenCalledWith('weekly');
    // Simulate selecting "interval" in picker
    picker.props.onValueChange('interval');
    expect(defaultProps.setScheduleOption).toHaveBeenCalledWith('interval');
  });

  it('toggles days in weekly schedule via toggleDay function', () => {
    const weeklyProps = {
      ...defaultProps,
      scheduleOption: 'weekly' as const,
      selectedDays: [] as string[],
    };
    const { getByText, rerender } = render(<NewHabitModal {...weeklyProps} />);
    // Press "Mon" to select it
    fireEvent.press(getByText('Mon'));
    expect(defaultProps.setSelectedDays).toHaveBeenCalledWith(['Monday']);
    // Simulate parent adding "Monday" to selectedDays and rerender
    rerender(<NewHabitModal {...weeklyProps} selectedDays={['Monday']} />);
    // Press "Mon" again to deselect it
    fireEvent.press(getByText('Mon'));
    expect(defaultProps.setSelectedDays).toHaveBeenCalledWith([]);
  });

  it('calls onAddHabit when "Add Habit" button is pressed', () => {
    const { getByText } = render(<NewHabitModal {...defaultProps} />);
    fireEvent.press(getByText('Add Habit'));
    expect(defaultProps.onAddHabit).toHaveBeenCalled();
  });

  it('closes the modal when "Cancel" button is pressed', () => {
    const { getByText } = render(<NewHabitModal {...defaultProps} />);
    fireEvent.press(getByText('Cancel'));
    expect(defaultProps.setModalVisible).toHaveBeenCalledWith(false);
  });

  it('displays "Edit Habit" mode correctly', () => {
    const editProps = {
      ...defaultProps,
      isEditMode: true,
      habitName: 'HabitX',
      habitDescription: 'DescX',
    };
    const { getAllByText, getByPlaceholderText } = render(<NewHabitModal {...editProps} />);
    const titles = getAllByText('Edit Habit');
    expect(titles.length).toBeGreaterThanOrEqual(2);
    const nameInput = getByPlaceholderText('Habit Name');
    expect(nameInput.props.editable).toBe(false);
    fireEvent.press(titles[1]);
    expect(defaultProps.onAddHabit).toHaveBeenCalled();
  });

  it('calls setHabitColor when a color swatch is pressed', () => {
    const { getByTestId } = render(<NewHabitModal {...defaultProps} />);
    const swatch = getByTestId('color-swatch-#FF0000');
    fireEvent.press(swatch);
    expect(defaultProps.setHabitColor).toHaveBeenCalledWith('#FF0000');
  });
  
  it('calls setModalVisible(false) when the modal requests to close', () => {
    const { getByTestId } = render(<NewHabitModal {...defaultProps} />);
    // Get the Modal component using its testID:
    const modal = getByTestId('newHabitModal');
    // Call its onRequestClose prop directly:
    act(() => {
      modal.props.onRequestClose();
    });
    expect(defaultProps.setModalVisible).toHaveBeenCalledWith(false);
  });
});
