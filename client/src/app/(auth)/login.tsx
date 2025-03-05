import { useState } from 'react';
import { TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { logIn } from '../../lib/client';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { AuthStyles } from '../../components/styles/AuthStyles';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { theme } = useTheme();

    const handleLogin = async () => {
        try {
            await logIn(email, password);
            router.replace('/(tabs)/habits');
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
                        Log In
                    </ThemedText>

                    {error ? (
                        <ThemedText style={AuthStyles.error}>{error}</ThemedText>
                    ) : null}

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

                    <TouchableOpacity style={AuthStyles.button} onPress={handleLogin}>
                        <ThemedText type="defaultSemiBold">Login</ThemedText>
                    </TouchableOpacity>

                    <Link href="/signup" asChild>
                        <TouchableOpacity style={AuthStyles.linkButton}>
                            <ThemedText style={AuthStyles.linkText}>
                                Don't have an account? Sign up
                            </ThemedText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}