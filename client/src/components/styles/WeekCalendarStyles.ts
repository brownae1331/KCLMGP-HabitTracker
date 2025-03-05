import { StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get("window").width;

export const WeekCalendarStyles = StyleSheet.create({
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
        justifyContent: 'space-between',
        width: 50,
        height: 60,
        paddingVertical: 6,
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
    },
    todayRing: {
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedCircle: {
        backgroundColor: '#007AFF',
        borderRadius: 15,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});