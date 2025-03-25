import { StyleSheet, Platform } from 'react-native';

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
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            android: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)'
            }
        }),
    },
    descriptionInput: {
        height: 60,
        textAlignVertical: 'top',
    },
    sliderContainer: {
        flexDirection: 'row',
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#a39d41',
        borderRadius: 25,
        overflow: 'hidden',
    },
    sliderOption: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: '#a39d41',
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
        borderColor: '#a39d41',
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
        backgroundColor: '#a39d41',
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