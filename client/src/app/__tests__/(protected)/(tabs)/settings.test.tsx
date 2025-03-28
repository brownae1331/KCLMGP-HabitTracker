// settings.test.tsx
import React from 'react';
import { Alert, Platform } from 'react-native';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import SettingsScreen from '../../../(protected)/(tabs)/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { deleteUser, exportUserData } from '../../../../lib/client';
import * as NotificationsHandler from '../../../NotificationsHandler';

// --- Setup global environment ---
if (typeof window === "undefined") {
  (global as any).window = {};
}
// Merge our custom properties into global.window
Object.assign(global.window, {
  alert: jest.fn(),
  URL: {
    createObjectURL: jest.fn(() => 'blob:url'),
    revokeObjectURL: jest.fn(),
  },
  confirm: jest.fn(),
});

// --- Mocks ---
// Prevent fonts from causing errors
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve({})),
}));

// Mock vector icons using inline require so that out‐of‐scope variables aren’t referenced.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const RN = require('react-native');
  return {
    Feather: (props: any) => <RN.Text testID="feather-icon" {...props}>{props.name}</RN.Text>,
  };
});

// Extend client module mocks
jest.mock('../../../../lib/client', () => ({
  deleteUser: jest.fn(),
  exportUserData: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock WeeklyCalendar using inline require inside factory
jest.mock('../../../../components/WeeklyCalendar', () => ({
  WeeklyCalendar: (props: any) => {
    const RN = require('react-native');
    return <RN.Text testID="weekly-calendar">{props.selectedDate}</RN.Text>;
  },
}));

// Mock NewHabitModal to render a Text element with JSON stringified props
jest.mock('../../../../components/NewHabitModal', () => ({
  NewHabitModal: (props: any) => {
    const RN = require('react-native');
    return <RN.Text testID="new-habit-modal">{JSON.stringify(props)}</RN.Text>;
  },
}));

// Mock IconSymbol using inline require
jest.mock('../../../../components/ui/IconSymbol', () => ({
  IconSymbol: (props: any) => {
    const RN = require('react-native');
    return <RN.Text testID="icon-symbol" {...props}>{props.name}</RN.Text>;
  },
}));

// Mock ThemedText using inline require
jest.mock('../../../../components/ThemedText', () => {
  const React = require('react');
  const RN = require('react-native');
  return {
    ThemedText: (props: any) => <RN.Text {...props}>{props.children}</RN.Text>,
  };
});

// Mock SharedStyles and Colors with inline objects
jest.mock('../../../../components/styles/SharedStyles', () => ({
  SharedStyles: { titleContainer: { padding: 10 }, addButtonContainer: {} },
}));
jest.mock('../../../../components/styles/Colors', () => ({
  Colors: {
    light: {
      text: '#000000',
      background: '#ffffff',
      background2: '#f0f0f0',
      placeholder: '#999999',
      tint: 'blue',
      border: 'lightgray',
      graphBackground: '#ededed',
      pickerBackground: '#f7f7f7',
    },
    dark: {
      text: '#ffffff',
      background: '#000000',
      background2: '#333333',
      placeholder: '#aaaaaa',
      tint: 'blue',
      border: 'darkgray',
      graphBackground: '#222222',
      pickerBackground: '#444444',
    },
  },
}));

// Mock ThemeContext so theme is always light
jest.mock('../../../../components/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: jest.fn() }),
}));

// Mock NotificationsHandler
jest.mock('../../../NotificationsHandler', () => ({
  enableNotifications: jest.fn(),
  disableNotifications: jest.fn(),
  getNotificationStatus: jest.fn(),
}));

// Mock FileSystem from expo-file-system (already defined above)
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock router from expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

// Use fake timers for setTimeout in the component
jest.useFakeTimers();

// Cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
});

describe('SettingsScreen', () => {
  const originalPlatform = Platform.OS;
  const originalAlert = Alert.alert;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.window as any).alert.mockClear();
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    Alert.alert = originalAlert;
  });

  test('renders correctly and fetches notification status', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(false);
    const { getByText } = render(<SettingsScreen />);
    await waitFor(() => {
      expect(NotificationsHandler.getNotificationStatus).toHaveBeenCalled();
    });
    expect(getByText('Settings')).toBeTruthy();
  });

  test('toggleNotifications: enables notifications when toggled from false to true', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(false);
    (NotificationsHandler.enableNotifications as jest.Mock).mockResolvedValue(undefined);
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => expect(NotificationsHandler.getNotificationStatus).toHaveBeenCalled());
    const switches = getAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(2);
    await act(async () => {
      fireEvent(switches[1], 'valueChange', true);
    });
    expect(NotificationsHandler.enableNotifications).toHaveBeenCalled();
  });

  test('toggleNotifications: disables notifications when toggled from true to false', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(true);
    (NotificationsHandler.disableNotifications as jest.Mock).mockResolvedValue(undefined);
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => expect(NotificationsHandler.getNotificationStatus).toHaveBeenCalled());
    const switches = getAllByRole('switch');
    await act(async () => {
      fireEvent(switches[1], 'valueChange', false);
    });
    expect(NotificationsHandler.disableNotifications).toHaveBeenCalled();
  });

  test('toggleNotifications: shows alert on error', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(false);
    (NotificationsHandler.enableNotifications as jest.Mock).mockRejectedValue(new Error('Test error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getAllByRole } = render(<SettingsScreen />);
    await waitFor(() => expect(NotificationsHandler.getNotificationStatus).toHaveBeenCalled());
    const switches = getAllByRole('switch');
    await act(async () => {
      fireEvent(switches[1], 'valueChange', true);
    });
    expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to update notification settings.');
  });

  describe('handleExportData', () => {
    test('shows error alert when no email is stored (non-web)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No email found');
    });

    test('shows window alert when no email is stored (web)', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const windowAlertSpy = jest.fn();
      Object.assign(global.window, { alert: windowAlertSpy });
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      expect(windowAlertSpy).toHaveBeenCalledWith('Error: No email found');
    });

    test('exports data on ios when email exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (exportUserData as jest.Mock).mockResolvedValue({ data: 'dummy' });
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      await waitFor(() => {
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith(
          'Exported Data',
          expect.stringContaining('Data saved to')
        );
      });
    });

    test('exports data on web when email exists', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (exportUserData as jest.Mock).mockResolvedValue({ data: 'dummy' });
      // For web branch, simulate anchor behavior:
      const clickMock = jest.fn();
      const aElement = { href: '', download: '', click: clickMock };
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string, options?: ElementCreationOptions) => {
        if (tag === 'a') {
          const aElement = originalCreateElement('a', options);
          // Modify the anchor element as needed.
          aElement.href = '';
          aElement.download = '';
          // Override the click function with a jest.fn()
          (aElement as any).click = jest.fn();
          return aElement;
        }
        return originalCreateElement(tag, options);
      });
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
      const revokeObjectURLSpy = jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      const windowAlertSpy = jest.fn();
      Object.assign(global.window, { alert: windowAlertSpy });
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      await waitFor(() => {
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(aElement.href).toBe('blob:url');
        expect(aElement.download).toBe('exportData.json');
        expect(appendChildSpy).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalledWith(aElement);
        expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
        expect(windowAlertSpy).toHaveBeenCalledWith('Exported Data: Data downloaded as exportData.json');
      });
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });

    test('shows error alert on export data failure (non-web)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (exportUserData as jest.Mock).mockRejectedValue(new Error('Export error'));
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      expect(alertSpy).toHaveBeenCalledWith('Failed to export data');
    });

    test('shows window alert on export data failure (web)', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (exportUserData as jest.Mock).mockRejectedValue(new Error('Export error'));
      const windowAlertSpy = jest.fn();
      Object.assign(global.window, { alert: windowAlertSpy });
      const { getByText } = render(<SettingsScreen />);
      const exportButton = getByText('Export My Data');
      await act(async () => {
        fireEvent.press(exportButton);
      });
      expect(windowAlertSpy).toHaveBeenCalledWith('Failed to export data');
    });
  });

  describe('handleSignOut', () => {
    test('should sign out successfully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(null);
      const { getByText } = render(<SettingsScreen />);
      const signOutButton = getByText('Sign Out');
      await act(async () => {
        fireEvent.press(signOutButton);
      });
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(router.replace).toHaveBeenCalledWith('/login');
    });

    test('should show alert on sign out error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Sign out error'));
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<SettingsScreen />);
      const signOutButton = getByText('Sign Out');
      await act(async () => {
        fireEvent.press(signOutButton);
      });
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to sign out.');
    });
  });

  describe('DeleteUser and confirmUserDeletion', () => {
    test('DeleteUser: should show error when no email is found (non-web)', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const alertSpy = jest.spyOn(Alert, 'alert');
      const { getByText } = render(<SettingsScreen />);
      const deleteButton = getByText('Delete My Data/Account');
      await act(async () => {
        fireEvent.press(deleteButton);
      });
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No email found');
    });

    test('DeleteUser: should delete user successfully on non-web', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (deleteUser as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(null);
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        const deleteBtn = buttons?.find((b: any) => b.text === 'Delete');
        if (deleteBtn && deleteBtn.onPress) {
          deleteBtn.onPress();
        }
      });
      const { getByText } = render(<SettingsScreen />);
      const deleteButton = getByText('Delete My Data/Account');
      await act(async () => {
        fireEvent.press(deleteButton);
      });
      await waitFor(() => {
        expect(deleteUser).toHaveBeenCalledWith('test@example.com');
        expect(alertSpy).toHaveBeenCalledWith('User Deleted', 'User has been deleted successfully.');
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });

    test('DeleteUser: should show error on delete failure (web)', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      (deleteUser as jest.Mock).mockRejectedValue(new Error('Delete error'));
      const windowAlertSpy = jest.fn();
      Object.assign(global.window, { alert: windowAlertSpy });
      const { getByText } = render(<SettingsScreen />);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      const deleteButton = getByText('Delete My Data/Account');
      await act(async () => {
        fireEvent.press(deleteButton);
      });
      expect(window.alert).toHaveBeenCalledWith('Delete error');
    });

    test('confirmUserDeletion: should cancel deletion on web when user cancels', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      // Instead of spying on window.confirm (which may be restricted), we override it manually:
      (global.window as any).confirm = () => false;
      const { getByText } = render(<SettingsScreen />);
      const deleteButton = getByText('Delete My Data/Account');
      await act(async () => {
        fireEvent.press(deleteButton);
      });
      expect(consoleLogSpy).toHaveBeenCalledWith('Delete canceled on Web');
      consoleLogSpy.mockRestore();
    });
  });

  test('renderItem: pressing a setting option navigates to correct route', async () => {
    const { getByText } = render(<SettingsScreen />);
    const accountOption = getByText('Account');
    await act(async () => {
      fireEvent.press(accountOption);
    });
    expect(router.push).toHaveBeenCalledWith('/account');
  });

  test('Dark Mode switch should call toggleTheme', async () => {
    const { useTheme } = require("../../../../components/ThemeContext");
    const toggleThemeMock = useTheme().toggleTheme;
    const { getAllByRole } = render(<SettingsScreen />);
    const switches = getAllByRole("switch");
    expect(switches.length).toBeGreaterThanOrEqual(2);
    await act(async () => {
      fireEvent(switches[0], 'valueChange', true);
    });
    expect(toggleThemeMock).toHaveBeenCalled();
  });
});
