import { StyleSheet, Platform } from 'react-native';

// Reusable global styles for inputs, buttons, and layout containers
export const SharedStyles = StyleSheet.create({
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#a39d41',
        borderRadius: 4,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    addButtonContainer: {
        padding: 16,
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
        minHeight: 60,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
});