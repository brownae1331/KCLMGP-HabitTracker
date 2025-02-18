// Start of Selection
import { StyleSheet } from 'react-native';

// Core Reusable Styles
export const SharedStyles = StyleSheet.create({
    /** Text Styles */
    textDark: {
        color: '#333333',
    },
    textLight: {
        color: '#FFFFFF',
    },
    textBold: {
        fontWeight: 'bold',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    daysText: {
        marginLeft: 8,
    },

    /** Input Styles */
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
        color: '#333333',
    },

    /** Button Styles */
    button: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 4,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
    },
    cancelButton: {
        backgroundColor: '#CCCCCC',
    },

    /** Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    scrollContent: {
        padding: 20,
    },

    /** Section Styles */
    sectionLabel: {
        marginBottom: 4,
        fontWeight: '500',
    },
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    selectedDateText: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 15,
        color: '#333333',
    },
    addButtonContainer: {
        padding: 16,
        alignItems: 'center',
    },





    titleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
});