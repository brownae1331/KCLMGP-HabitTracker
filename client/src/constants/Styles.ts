import { StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from './Colors';

const SCREEN_WIDTH = Dimensions.get("window").width;

export const SharedStyles = StyleSheet.create({
    // Layout
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    selectedDateText: {
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
        color: "#333",
    },
    calendarWrapper: {
        width: SCREEN_WIDTH,
        overflow: "hidden",
    },
    calendarContainer: {
        flexDirection: "row",
        width: SCREEN_WIDTH * 3,
        alignItems: "center",
        justifyContent: "center",
    },
    weekContainer: {
        width: SCREEN_WIDTH,
        flexDirection: "row",
        justifyContent: "space-around",
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    dayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    today: {
        backgroundColor: '#007AFF',
    },
    selectedDay: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
    },
    textDark: {
        color: '#333333',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#FF9800",
        alignItems: "center",
        justifyContent: "center",
    },
    selectedText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
    },
    dateText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    todayRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#007AFF",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    addButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F0F0',
        marginTop: 20,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        marginBottom: 12,
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    descriptionInput: {
        // Give a bit more room for multiline text
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
    sectionLabel: {
        marginBottom: 4,
        fontWeight: '500',
    },
    picker: {
        width: '100%',
        backgroundColor: '#000',
        marginBottom: 0,
        color: '#333333',
    },
    intervalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    daysText: {
        marginLeft: 8,
    },
    weeklyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dayButton: {
        padding: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 4,
        margin: 4,
    },
    selectedDayButton: {
        backgroundColor: '#007AFF',
    },
    dayButtonText: {
        color: '#007AFF',
    },
    selectedDayButtonText: {
        color: '#fff',
    },
    button: {
        flex: 1,
        paddingVertical: 10,
        backgroundColor: '#007AFF',
        borderRadius: 4,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
    },
    // Horizontal scroll container for color swatches
    colorPickerContainer: {
        paddingVertical: 8,
    },
    // Individual color swatch
    colorSwatch: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    // Highlight the chosen color
    selectedSwatch: {
        borderColor: '#007AFF',
    },
    // Goal Section
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
    modalContent: {
        width: '90%',
        maxHeight: '90%', // Limit modal height
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    scrollContent: {
        padding: 20,
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
}); 