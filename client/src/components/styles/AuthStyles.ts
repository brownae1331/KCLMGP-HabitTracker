import { StyleSheet } from 'react-native';

export const AuthStyles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    card: {
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
    },
    input: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
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

});