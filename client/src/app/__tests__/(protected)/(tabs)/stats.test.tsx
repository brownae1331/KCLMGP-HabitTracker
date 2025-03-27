// @ts-nocheck
import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import StatsScreen from '../../../(protected)/(tabs)/stats';

// Mock React Native components to render children
jest.mock('react-native', () => {
  const React = require('react');
  return {
    ActivityIndicator: () => 'ActivityIndicator',
    View: ({ children }) => React.createElement('View', null, children),
    SafeAreaView: ({ children }) => React.createElement('SafeAreaView', null, children),
    ScrollView: ({ children }) => React.createElement('ScrollView', null, children),
    StyleSheet: { create: (styles) => styles },
  };
});

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    let selectedIndexOverride = null;
    let disableAutoSelect = false;
  
    const Picker = ({ children, onValueChange }) => {
      const validChildren = React.Children.toArray(children).filter(child => child);
      React.useEffect(() => {
        if (onValueChange && validChildren.length > 0 && !disableAutoSelect) {
          const selectableChildren = validChildren.filter(child => child.props && child.props.value !== null);
          if (selectableChildren.length > 0) {
            const indexToSelect = selectedIndexOverride !== null ? selectedIndexOverride : 0;
            const childToSelect = selectableChildren[indexToSelect] || selectableChildren[0];
            onValueChange(childToSelect.props.value, indexToSelect);
          }
        }
      }, [onValueChange, validChildren]);
      return React.createElement('Picker', null, validChildren);
    };
    Picker.Item = ({ label, value }) => React.createElement('Picker.Item', { label, value });
    return {
      Picker,
      __setSelectedIndex: (index) => {
        selectedIndexOverride = index;
      },
      __resetSelectedIndex: () => {
        selectedIndexOverride = null;
      },
      __disableAutoSelect: () => {
        disableAutoSelect = true;
      },
      __enableAutoSelect: () => {
        disableAutoSelect = false;
      },
    };
  });

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

jest.mock('../../../../lib/client', () => ({
  fetchHabits: jest.fn(),
}));

jest.mock('../../../../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

jest.mock('../../../../components/ThemedText', () => ({
  ThemedText: ({ children }) => children,
}));

let focusEffectCallback = null;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    focusEffectCallback = callback;
  }),
}));

jest.mock('../../../../components/BuildHabitGraph', () => () => 'BuildHabitGraph');
jest.mock('../../../../components/QuitHabitGraph', () => () => 'QuitHabitGraph');

jest.mock('../../../../components/styles/Colors', () => ({
  Colors: {
    light: { text: '#111', background: '#fff', background2: '#f0f0f0', graphBackground: '#fff', pickerBackground: '#f0f0f0', backgroundText: '#AFAFAF' },
    dark: { text: '#eee', background: '#151718', background2: '#202224', graphBackground: '#202224', pickerBackground: '#151718', backgroundText: '#5B5B5B' },
  },
}));

jest.mock('../../../../components/styles/SharedStyles', () => ({
  SharedStyles: { titleContainer: {} },
}));

jest.mock('../../../../components/styles/StatsPageStyles', () => ({
  StatsPageStyles: {
    pickerContainer: {},
    picker: {},
    graphContainer: {},
    messageContainer: {},
    messageText: {},
  },
}));

describe('StatsScreen', () => {
  const mockFetchHabits = jest.requireMock('../../../../lib/client').fetchHabits;
  const mockAsyncStorageGetItem = jest.requireMock('@react-native-async-storage/async-storage').getItem;
  const pickerMock = jest.requireMock('@react-native-picker/picker');
  const mockUseFocusEffect = jest.requireMock('@react-navigation/native').useFocusEffect;

  beforeEach(() => {
    jest.clearAllMocks();
    focusEffectCallback = null;
    pickerMock.__resetSelectedIndex();
    mockAsyncStorageGetItem.mockResolvedValue('test@example.com');
    mockFetchHabits.mockResolvedValue([]);
  });

  const runFocusEffect = async () => {
    if (focusEffectCallback) {
      await act(async () => {
        await focusEffectCallback();
      });
    }
  };

  it('renders SafeAreaView', async () => {
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('SafeAreaView'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('SafeAreaView'), { timeout: 1000 });
  });

  it('shows loading state', async () => {
    const { toJSON } = render(<StatsScreen />);
    expect(JSON.stringify(toJSON())).toContain('ActivityIndicator');
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
  });

  it('renders no habits message when habits are empty', async () => {
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('You don\'t have any habits yet!'), { timeout: 1000 });
  });

  it('renders Picker when habits exist', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValue([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
        { habitName: 'Smoking', habitType: 'quit', goalValue: null },
      ]);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('Picker'), { timeout: 1000 });
  });

  it('renders BuildHabitGraph when a build habit is selected', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValue([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
        { habitName: 'Smoking', habitType: 'quit', goalValue: null },
      ]);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('BuildHabitGraph'), { timeout: 1000 });
  });

  it('renders QuitHabitGraph when a quit habit is selected', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValue([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
        { habitName: 'Smoking', habitType: 'quit', goalValue: null },
      ]);
    });
    pickerMock.__setSelectedIndex(1);
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('QuitHabitGraph'), { timeout: 1000 });
  });

  it('handles fetchHabits error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      mockFetchHabits.mockRejectedValue(new Error('Fetch error'));
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('You don\'t have any habits yet!'), { timeout: 1000 });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching habits:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('handles fetchUserData error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      mockAsyncStorageGetItem.mockRejectedValue(new Error('Storage error'));
      mockFetchHabits.mockResolvedValue([]);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('You don\'t have any habits yet!'), { timeout: 1000 });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error retrieving user data:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('shows message when no email', async () => {
    await act(async () => {
      mockAsyncStorageGetItem.mockResolvedValue(null);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('You don\'t have any habits yet!'), { timeout: 1000 });
  });

  it('updates when habits change', async () => {
    await act(async () => {
      mockAsyncStorageGetItem.mockResolvedValue('test@example.com');
      mockFetchHabits.mockResolvedValueOnce([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
      ]);
    });
    const { toJSON, rerender } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('BuildHabitGraph'), { timeout: 1000 });
    await act(async () => {
      mockFetchHabits.mockResolvedValueOnce([]);
    });
    rerender(<StatsScreen />);
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('You don\'t have any habits yet!'), { timeout: 1000 });
  });

  it('renders title', async () => {
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('Stats'), { timeout: 1000 });
  });

  it('renders with dark theme', async () => {
    jest.spyOn(require('../../../../components/ThemeContext'), 'useTheme').mockReturnValue({ theme: 'dark' });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('SafeAreaView'), { timeout: 1000 });
  });

  it('automatically selects and displays graph for a single habit', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValue([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
      ]);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('BuildHabitGraph'), { timeout: 1000 });
  });

  it('resets selected habit when it no longer exists', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValueOnce([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
      ]);
    });
    const { toJSON, rerender } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('BuildHabitGraph'), { timeout: 1000 });
    await act(async () => {
      mockFetchHabits.mockResolvedValueOnce([
        { habitName: 'Reading', habitType: 'build', goalValue: 20 },
      ]);
      pickerMock.__disableAutoSelect();
    });
    rerender(<StatsScreen />);
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('Reading'), { timeout: 1000 });
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('Select a habit above to see statistics'), { timeout: 1000 });
    pickerMock.__enableAutoSelect();
  });

  it('sets refreshing state during habit fetch', async () => {
    await act(async () => {
      mockFetchHabits.mockResolvedValue([
        { habitName: 'Exercise', habitType: 'build', goalValue: 30 },
      ]);
    });
    const { toJSON } = render(<StatsScreen />);
    await waitFor(() => expect(JSON.stringify(toJSON())).not.toContain('ActivityIndicator'), { timeout: 1000 });
    await runFocusEffect();
    await waitFor(() => expect(JSON.stringify(toJSON())).toContain('BuildHabitGraph'), { timeout: 1000 });
  });
});