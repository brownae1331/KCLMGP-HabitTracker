import { StyleSheet } from "react-native";

export const CalendarPageStyles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        gap: 8,
        padding: 16,
    },
    calendarContainer: {
        padding: 16,
        paddingBottom: 0,
    },
    statsContainer: {
        marginTop: 5,
        alignItems: "center",
        padding: 16,
        backgroundColor: "#1E1E1E",
        borderRadius: 10,
    },
    habitsContainer: {
        marginTop: 10,
        alignItems: "center",
    },
    separator: {
        width: "100%",
        height: 1,
        marginVertical: 10,
    },
    progressContainer: {
        alignItems: 'center',
        marginTop: 20,
        position: 'relative',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    percentageTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    percentageText: {
        color: "#a39d41",
        fontSize: 22,
        fontWeight: "bold",
    },
});