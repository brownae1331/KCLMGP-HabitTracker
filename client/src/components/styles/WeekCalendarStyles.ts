import { StyleSheet, useWindowDimensions, Platform } from 'react-native';


export const useWeekCalendarStyles = () => {
    const { width } = useWindowDimensions();


    return StyleSheet.create({
        calendarWrapper: {
            width: width,
            overflow: "hidden",
        },
        weekContainer: {
            width: width,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
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
        arrowButton: {
            padding: 10,
            marginHorizontal: 10,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: Platform.OS === 'web' ? "#f0f0f0" : "transparent",
            borderRadius: 10,
            minWidth: 40,
        },
        arrowText: {
            fontSize: 24,
            fontWeight: "bold",
            color: "#007AFF",
        },
    });
};
