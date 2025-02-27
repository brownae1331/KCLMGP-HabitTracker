import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { logIn } from '../../lib/client';
import { ThemedText } from '../../components/ThemedText';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

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
        <SafeAreaView style={styles.background}>
            <ScrollView contentContainerStyle={styles.container} keyboardDismissMode="on-drag">
                <View style={styles.card}>
                    <ThemedText type="title" style={styles.title}>
                        Log In
                    </ThemedText>

                    {error ? (
                        <ThemedText style={styles.error}>{error}</ThemedText>
                    ) : null}

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <ThemedText style={styles.buttonText}>Login</ThemedText>
                    </TouchableOpacity>

                    <Link href="/signup" asChild>
                        <TouchableOpacity style={styles.linkButton}>
                            <ThemedText style={styles.linkText}>
                                Don't have an account? Sign up
                            </ThemedText>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#f0f4f7', // Light background color for better aesthetics
    },
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    input: {
        backgroundColor: '#e8e8e8',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#007AFF',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
        fontSize: 14,
    },
    clearButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 10,
    },
    clearButtonText: {
        color: '#FF0000',
        fontSize: 14,
        fontWeight: 'bold',
    },
});