import { useState } from 'react';
import { TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { createUser } from '../../lib/client';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { AuthStyles } from '../../components/styles/AuthStyles';

// Signup screen – allows new users to create an account and access the protected area of the app
export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const { theme } = useTheme();

    // Sends signup request and navigates user to the protected area upon success
    const handleSignup = async () => {
        try {
            await createUser(email, password, username);
            router.replace('/(protected)/(tabs)/habits');
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
            <ScrollView contentContainerStyle={AuthStyles.container} keyboardDismissMode="on-drag">
                <View style={[AuthStyles.card, { backgroundColor: Colors[theme].background2 }]}>
                    <ThemedText type="title" style={[AuthStyles.title, { color: Colors[theme].text }]}>
                        Sign Up
                    </ThemedText>

                    {error ? <ThemedText style={AuthStyles.error}>{error}</ThemedText> : null}

                    <TextInput
                        style={[AuthStyles.input, { backgroundColor: Colors[theme].border, color: Colors[theme].text }]}
                        placeholder="Username"
                        placeholderTextColor={Colors[theme].placeholder}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <TextInput
                        style={[AuthStyles.input, { backgroundColor: Colors[theme].border, color: Colors[theme].text }]}
                        placeholder="Email"
                        placeholderTextColor={Colors[theme].placeholder}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={[AuthStyles.input, { backgroundColor: Colors[theme].border, color: Colors[theme].text }]}
                        placeholder="Password"
                        placeholderTextColor={Colors[theme].placeholder}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={AuthStyles.button} onPress={handleSignup}>
                        <ThemedText type="defaultSemiBold">Sign Up</ThemedText>
                    </TouchableOpacity>

                    <Link href="/login" asChild>
                        <TouchableOpacity style={AuthStyles.linkButton}>
                            <ThemedText style={AuthStyles.linkText}>
                                Already have an account? Log in
                            </ThemedText>
                        </TouchableOpacity>
                    </Link>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}