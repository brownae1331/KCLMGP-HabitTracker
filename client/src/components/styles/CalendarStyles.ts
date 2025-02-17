import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get("window").width;

export const CalendarStyles = StyleSheet.create({
    calendarWrapper: {
        width: SCREEN_WIDTH,
        overflow: "hidden",
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
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 12,
        padding: 4,
    },
    selectedCircle: {
        backgroundColor: '#007AFF',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ scale: 1.1 }],
    },
    selectedText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});