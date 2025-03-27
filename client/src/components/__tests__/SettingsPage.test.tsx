// SettingsScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsScreen from '../../app/(protected)/(tabs)/settings';
import * as client from '../../lib/client';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import * as NotificationsHandler from '../../app/NotificationsHandler';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../../lib/client', () => ({
  deleteUser: jest.fn(),
  exportUserData: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///dummy/',
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('../../NotificationsHandler', () => ({
  enableNotifications: jest.fn(),
  disableNotifications: jest.fn(),
  getNotificationStatus: jest.fn(() => Promise.resolve(false)),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Feather: (props: any) => `FeatherIcon(${props.name})`,
}));

// For web globals
if (typeof window === 'undefined') {
  global.window = {} as any;
}
window.alert = jest.fn();
window.confirm = jest.fn();

describe('SettingsScreen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------- Export Data Tests ----------------------
  describe('Export Data', () => {
    it('alerts error if no stored email found', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Export My Data'));
      await waitFor(() => {
        if (Platform.OS === 'web') {
          expect(window.alert).toHaveBeenCalledWith('Error: No email found');
        } else {
          expect(Alert.alert).toHaveBeenCalledWith('Error', 'No email found');
        }
      });
    });

    it('alerts failure when exportUserData fetch fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      (client.exportUserData as jest.Mock).mockRejectedValue(new Error('Export failed'));
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Export My Data'));
      await waitFor(() => {
        if (Platform.OS === 'web') {
          expect(window.alert).toHaveBeenCalledWith('Failed to export data');
        } else {
          expect(Alert.alert).toHaveBeenCalledWith('Failed to export data');
        }
      });
    });

    it('successfully exports data on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      const fakeData = { key: 'value' };
      (client.exportUserData as jest.Mock).mockResolvedValue(fakeData);
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Export My Data'));
      await waitFor(() => {
        expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
          'Exported Data',
          expect.stringContaining('exportData.json')
        );
      });
    });

    it('successfully exports data on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      const fakeData = { some: 'data' };
      (client.exportUserData as jest.Mock).mockResolvedValue(fakeData);
      
      // Spy on window.URL methods and DOM manipulations
      const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:dummy');
      const revokeObjectURLSpy = jest.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      const fakeNode = document.createElement('div');
      const appendChildSpy = jest
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => fakeNode); // Return a Node
      const removeChildSpy = jest
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => fakeNode); // Same here
      const anchor = { click: jest.fn() };
      jest.spyOn(document, 'createElement').mockReturnValue(anchor as any);

      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Export My Data'));
      
      await waitFor(() => {
        expect(createObjectURLSpy).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
        expect(removeChildSpy).toHaveBeenCalled();
        expect(window.alert).toHaveBeenCalledWith('Exported Data: Data downloaded as exportData.json');
      });

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  // ---------------------- Sign Out Tests ----------------------
  describe('Sign Out', () => {
    it('removes token and navigates to login', async () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Sign Out'));
      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
        expect(router.replace).toHaveBeenCalledWith('/login');
      });
    });

    it('shows alert on sign out error', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Sign out failed'));
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Sign Out'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to sign out.');
      });
    });
  });

  // ---------------------- Toggle Notifications Tests ----------------------
  describe('Toggle Notifications', () => {
    it('toggles notifications on: enables notifications', async () => {
      // Ensure notifications are initially false
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Notifications'));
      await waitFor(() => {
        expect(NotificationsHandler.enableNotifications).toHaveBeenCalled();
      });
    });

    it('toggles notifications off: disables notifications', async () => {
      // Set initial state true by overriding useState temporarily
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Notifications'));
      await waitFor(() => {
        expect(NotificationsHandler.disableNotifications).toHaveBeenCalled();
      });
    });

    it('shows alert when toggling notifications fails', async () => {
      (NotificationsHandler.disableNotifications as jest.Mock).mockRejectedValue(new Error('Network error'));
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [true, jest.fn()]);
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Notifications'));
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to update notification settings.');
      });
    });
  });

  // ---------------------- Delete User Tests ----------------------
  describe('Delete User', () => {
    it('alerts error if no stored email for deletion', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        if (Platform.OS === 'web') {
          expect(window.alert).toHaveBeenCalledWith('Error: No email found');
        } else {
          expect(Alert.alert).toHaveBeenCalledWith('Error', 'No email found');
        }
      });
    });

    it('deletes user successfully on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      (client.deleteUser as jest.Mock).mockResolvedValue({ success: true });
      const { getByText } = render(<SettingsScreen />);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        expect(client.deleteUser).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('cancels deletion on web when user declines', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Delete canceled on Web');
      });
      consoleLogSpy.mockRestore();
    });

    it('handles deletion error and shows alert on web', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'web' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      (client.deleteUser as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      const { getByText } = render(<SettingsScreen />);
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window, 'alert').mockImplementation(() => {});
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Delete failed');
      });
    });

    it('deletes user successfully on native', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('test@example.com');
      (client.deleteUser as jest.Mock).mockResolvedValue({ success: true });
      const { getByText } = render(<SettingsScreen />);
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((b) => b.text === 'Delete');
        if (deleteButton && deleteButton.onPress) {
          deleteButton.onPress();
        }
      });
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        expect(client.deleteUser).toHaveBeenCalledWith('test@example.com');
      });
      alertSpy.mockRestore();
    });

    it('handles deletion cancellation on native', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        const cancelButton = buttons?.find((b) => b.text === 'Cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Delete My Data/Account'));
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith('Delete canceled');
      });
      alertSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  // ---------------------- Render and Navigation Tests ----------------------
  describe('Render and Navigation', () => {
    it('renders settings options and buttons correctly', () => {
      const { getByText } = render(<SettingsScreen />);
      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Dark Mode')).toBeTruthy();
      expect(getByText('Notifications')).toBeTruthy();
      expect(getByText('Export My Data')).toBeTruthy();
      expect(getByText('Sign Out')).toBeTruthy();
      expect(getByText('Delete My Data/Account')).toBeTruthy();
    });

    it('navigates to account when settings option is pressed', async () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Account'));
      await waitFor(() => {
        expect(router.push).toHaveBeenCalledWith('/account');
      });
    });
  });
});
