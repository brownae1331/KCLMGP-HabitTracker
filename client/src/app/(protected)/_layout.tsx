import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../components/AuthContext';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';

/**
 * Protected layout component.
 * Handles authentication checks and restricts access to protected routes using auth context.
 */
export default function ProtectedLayout() {
    const { isAuthenticated, isLoading, checkAuthStatus } = useAuth();
    const [isChecking, setIsChecking] = useState(true);
    const { theme } = useTheme();

    useEffect(() => {
        const checkAuth = async () => {
            await checkAuthStatus();
            setIsChecking(false);
        };

        checkAuth();
    }, []);

    // Show loading indicator while checking authentication
    if (isLoading || isChecking) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background }}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </View>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Redirect href="/(auth)/login" />;
    }

    // User is authenticated, show protected content
    return (
        <Stack>
            {/* Tab screens don't need headers */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Enable default headers with back buttons for these screens */}
            <Stack.Screen
                name="account"
                options={{
                    headerTitle: "Account",
                    headerTintColor: Colors[theme].text,
                    headerStyle: { backgroundColor: Colors[theme].background }
                }}
            />
            <Stack.Screen
                name="appearance"
                options={{
                    headerTitle: "Appearance",
                    headerTintColor: Colors[theme].text,
                    headerStyle: { backgroundColor: Colors[theme].background }
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    headerTitle: "Notifications",
                    headerTintColor: Colors[theme].text,
                    headerStyle: { backgroundColor: Colors[theme].background }
                }}
            />
        </Stack>
    );
}