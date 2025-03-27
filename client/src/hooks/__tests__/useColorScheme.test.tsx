import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { useColorScheme } from '../useColorScheme';

// Mock modules
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


  it('uses stored theme if available', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light'); // system

    const { result } = renderHook(() => useColorScheme());

    // Let the async effect (loading from AsyncStorage) run
    await act(async () => {}); 
    // No actual updates required, just flush microtasks

    // Because stored theme was 'dark', the final result should be dark
    expect(result.current).toBe('dark');
  });

  it('defaults to system theme if no stored theme', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    const { result } = renderHook(() => useColorScheme());

    // Flush the async effect
    await act(async () => {});

    // The system is 'light', so final theme is 'light'
    expect(result.current).toBe('light');
  });

  it('updates theme when Appearance colorScheme changes', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    let listenerFn: ((prefs: { colorScheme: string }) => void) | null = null;
    (Appearance.addChangeListener as jest.Mock).mockImplementation((fn) => {
      listenerFn = fn;
      return { remove: jest.fn() };
    });

    const { result } = renderHook(() => useColorScheme());

    // Let initial async effect finish
    await act(async () => {});

    // Should match system: 'light'
    expect(result.current).toBe('light');

    // Now simulate OS changing to dark
    await act(async () => {
      listenerFn?.({ colorScheme: 'dark' });
    });
    expect(result.current).toBe('dark');
  });

  // 1) Covers line 6: the initial state fallback if system is null
  it('initializes theme to "light" if Appearance.getColorScheme is null', async () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());

    // Initially, theme is 'light' fallback
    expect(result.current).toBe('light');

    // Wait for the AsyncStorage effect to complete
    await act(async () => {
      await waitForNextUpdate();
    });

    // Still 'light' because no saved theme
    expect(result.current).toBe('light');
  });

  // 2) Covers line 14: setTheme(savedTheme as 'light' | 'dark')
  //    We load 'dark' from AsyncStorage to ensure that branch is taken.
  it('loads a stored theme "dark" and sets it (line 14)', async () => {
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');

    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());

    // Initially, the state is from useState(...) => 'light'
    expect(result.current).toBe('light');

    // Wait for the effect that reads AsyncStorage
    await act(async () => {
      await waitForNextUpdate();
    });

    // Now it should have updated to 'dark'
    expect(result.current).toBe('dark');
  });

  // 3) Covers line 21: subscription callback => setTheme(colorScheme)
  it('updates theme via Appearance subscription (line 21)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (Appearance.getColorScheme as jest.Mock).mockReturnValue('light');

    let subscriptionCallback: ((prefs: { colorScheme: string }) => void) | null = null;
    (Appearance.addChangeListener as jest.Mock).mockImplementation((fn) => {
      subscriptionCallback = fn;
      return { remove: jest.fn() };
    });

    const { result, waitForNextUpdate } = renderHook(() => useColorScheme());

    // The initial state after the first render is 'light'
    expect(result.current).toBe('light');

    // Wait for AsyncStorage effect — though it has no saved theme
    await act(async () => {
      await waitForNextUpdate();
    });

    // We remain 'light'
    expect(result.current).toBe('light');

    // Now simulate the OS switching to dark
    await act(async () => {
      subscriptionCallback?.({ colorScheme: 'dark' });
    });
    expect(result.current).toBe('dark');
  });
});
