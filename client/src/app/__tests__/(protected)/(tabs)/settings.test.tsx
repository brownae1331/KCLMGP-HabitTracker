import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsScreen from '../../../(protected)/(tabs)/settings';
import * as NotificationsHandler from '../../../NotificationsHandler';

jest.mock('@expo/vector-icons', () => ({
  Feather: (props: any) => `FeatherIcon(${props.name})`,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

global.fetch = jest.fn();

jest.mock('../../../NotificationsHandler', () => ({
  enableNotifications: jest.fn(),
  disableNotifications: jest.fn(),
  getNotificationStatus: jest.fn(() => Promise.resolve(false)),
}));

jest.mock('../../../../lib/client', () => ({
  deleteUser: jest.fn(),
  BASE_URL: 'http://localhost:3000',
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'mock-directory/',
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

describe('SettingsScreen Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('toggles notifications -> enabling triggers enableNotifications', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Notifications'));
    await waitFor(() => {
      expect(NotificationsHandler.enableNotifications).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Toggle function called on web!');
      expect(logSpy).toHaveBeenCalledWith('Enabling notifications...');
    });
    logSpy.mockRestore();
  });

  it('toggles notifications -> disabling triggers disableNotifications', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(true);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Notifications'));
    await waitFor(() => {
      expect(NotificationsHandler.disableNotifications).toHaveBeenCalled();
    });
  });

  it('toggle notifications -> error triggers alert', async () => {
    (NotificationsHandler.getNotificationStatus as jest.Mock).mockResolvedValue(true);
    (NotificationsHandler.disableNotifications as jest.Mock).mockRejectedValue(new Error('Network error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Notifications'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to update notification settings.');
    });
  });

  it('signs out user and navigates to login', async () => {
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Sign Out'));
    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
    });
  });

  it('export data -> no storedEmail triggers alert', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Export My Data'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No email found');
    });
  });

  it('export data -> fetch not ok triggers error alert', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Export My Data'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to export data');
    });
  });

  it('export data -> success on iOS saves file and shows alert', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ key: 'value' }) });
    const alertSpy = jest.spyOn(Alert, 'alert');
    const FileSystem = require('expo-file-system');
    const writeSpy = FileSystem.writeAsStringAsync;
    (writeSpy as jest.Mock).mockResolvedValue(undefined);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Export My Data'));
    await waitFor(() => {
      expect(writeSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Exported Data', expect.stringContaining('exportData.json'));
    });
  });

  it('export data -> success on web triggers download', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({ some: 'data' }) });
    global.URL.createObjectURL = jest.fn(() => 'blob:http://example.com/blob');
    global.URL.revokeObjectURL = jest.fn();
    const a = document.createElement('a');
    a.click = jest.fn();
    document.createElement = jest.fn(() => a);
    const alertSpy = jest.spyOn(window, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Export My Data'));
    await waitFor(() => {
      expect(a.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Exported Data'));
    });
  });

  it('delete user -> missing email triggers alert', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete My Data/Account'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No email found');
    });
  });

  it('delete user -> throws error shows alert', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web' });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
    const deleteUserMock = require('../../../../lib/client').deleteUser;
    deleteUserMock.mockRejectedValue(new Error('Delete failed'));
    const alertSpy = jest.spyOn(window, 'alert');
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete My Data/Account'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Delete failed');
    });
  });

  it('delete user -> success scenario on web', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'web' });
    jest.spyOn(global, 'confirm').mockReturnValue(true);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
    const deleteUserMock = require('../../../../lib/client').deleteUser;
    deleteUserMock.mockResolvedValue({ success: true });
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete My Data/Account'));
    await waitFor(() => {
      expect(deleteUserMock).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('delete user -> native cancel logs "Delete canceled"', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'android' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const cancelButton = buttons?.find(b => b.text === 'Cancel');
      cancelButton?.onPress?.();
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete My Data/Account'));
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('Delete canceled');
    });
  });

  it('delete user -> native confirm logs and deletes', async () => {
    Object.defineProperty(Platform, 'OS', { value: 'ios' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      const deleteButton = buttons?.find(b => b.text === 'Delete');
      deleteButton?.onPress?.();
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText } = render(<SettingsScreen />);
    fireEvent.press(getByText('Delete My Data/Account'));
    await waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('Delete confirmed');
    });
  });
});