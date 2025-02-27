import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { createUser } from '../../lib/client';
import { ThemedText } from '../../components/ThemedText';


export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSignup = async () => {
        try {
            await createUser(email, password, username);
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
                        Sign Up
                    </ThemedText>

                    {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}

                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#888"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

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

                    <TouchableOpacity style={styles.button} onPress={handleSignup}>
                        <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
                    </TouchableOpacity>

                    <Link href="/login" asChild>
                        <TouchableOpacity style={styles.linkButton}>
                            <ThemedText style={styles.linkText}>
                                Already have an account? Log in
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
        backgroundColor: '#f0f4f7',
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
    },
});