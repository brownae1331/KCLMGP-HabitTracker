import { StyleSheet } from 'react-native';

export const HabitModalStyles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '90%',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    descriptionInput: {
        height: 60,
        textAlignVertical: 'top',
    },
    sliderContainer: {
        flexDirection: 'row',
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 25,
        overflow: 'hidden',
    },
    sliderOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#007AFF',
    },
    sliderOptionText: {
        color: '#007AFF',
        fontWeight: '500',
    },
    selectedOptionText: {
        color: '#fff',
    },
    colorSwatch: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedSwatch: {
        borderColor: '#007AFF',
    },
    goalToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 8,
    },
    goalFieldsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        paddingTop: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    weeklyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    intervalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dayButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        marginBottom: 8,
    },
    selectedDayButton: {
        backgroundColor: '#007AFF',
    },
    dayButtonText: {
        color: '#333333',
    },
    selectedDayButtonText: {
        color: '#FFFFFF',
    },
    picker: {
        color: '#777',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 4,
        padding: 8,
    },
}); 