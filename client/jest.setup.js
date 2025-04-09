// Mock AsyncStorage to prevent "NativeModule: AsyncStorage is null" error
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
  
// Mock expo-router to prevent Jest test errors
jest.mock('expo-router', () => ({
Link: ({ children }) => children, // Render Link component directly
router: { replace: jest.fn() }, // Mock router.replace method
}));

// Fix possible React Native warning (if using react-native-reanimated)
global.__reanimatedWorkletInit = () => {}; 

// Mock ThemeContext to prevent "useTheme must be used within a ThemeProvider" error
jest.mock('./src/components/ThemeContext', () => ({
    ThemeProvider: ({ value, children }) => children,
    useTheme: () => ({
        dark: false,
        colors: {
        background: '#fff',
        text: '#000',
        primary: '#6200ee',
        card: '#f8f9fa',
        border: '#d1d1d1',
        notification: '#ff3d00',
        },
        fonts: {
        regular: 'Arial',
        bold: 'Arial-Bold',
        },
        theme: 'light',
        setTheme: jest.fn(),
    }),
}));


