import { StyleSheet } from 'react-native';

export const HabitModalStyles = StyleSheet.create({
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
        backgroundColor: '#fff',
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
    colorPickerContainer: {
        paddingVertical: 8,
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
        backgroundColor: '#fff',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    picker: {
        width: '100%',
        backgroundColor: '#fff',
        marginBottom: 12,
        color: '#333333',
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
}); 