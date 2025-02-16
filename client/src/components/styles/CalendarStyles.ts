import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get("window").width;

export const CalendarStyles = StyleSheet.create({
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
    selectedDay: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
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
}); 