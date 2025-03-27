import { Stack } from 'expo-router';

// Auth layout - sets up navgation between the login and signup pages
export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
        </Stack>
    );
}