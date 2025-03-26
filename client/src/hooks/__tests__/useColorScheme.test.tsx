import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useColorScheme } from '../useColorScheme'; // Adjust import path

// ----- Mocks -----
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn(),
    addChangeListener: jest.fn(),
  },
}));

describe('useColorScheme Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // 1) Test stored theme usage (covers setTheme(savedTheme as 'light' | 'dark'))
  // ------------------------------------------------------------------
  test('uses stored theme if available', async () => {
    // Suppose AsyncStorage says the user saved 'dark'
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    // Suppose system is 'light'
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    // Render the real hook
    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());

    // Wait for the async effect to finish
    await waitForNextUpdate();

    // Because stored theme is "dark", setTheme('dark') was called internally
    expect(result.current).toBe('dark');
  });

  // ------------------------------------------------------------------
  // 2) Test default to system theme if no saved theme
  // ------------------------------------------------------------------
  test('defaults to system theme if no stored theme', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());
    await waitForNextUpdate();

    // Because there's no saved theme, we fall back to system theme "light"
    expect(result.current).toBe('light');
  });

  // ------------------------------------------------------------------
  // 3) Test changing system appearance (COVERS setTheme(colorScheme as 'light' | 'dark'))
  // ------------------------------------------------------------------
  test('updates theme when Appearance colorScheme changes', async () => {
    // No stored theme => rely on system
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    // We'll store the callback so we can manually invoke it
    let listenerFn: ((prefs: { colorScheme: string }) => void) | null = null;
    (Appearance.addChangeListener as jest.Mock).mockImplementation((fn) => {
      listenerFn = fn;
      return { remove: jest.fn() }; // Stub remove() to match the real API
    });

    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());
    await waitForNextUpdate();

    // Initially "light"
    expect(result.current).toBe('light');

    // Now simulate a system theme change to "dark"
    act(() => {
      listenerFn?.({ colorScheme: 'dark' });
    });

    // That callback calls setTheme(colorScheme),
    // so the hook should now read "dark".
    expect(result.current).toBe('dark');
  });
});
