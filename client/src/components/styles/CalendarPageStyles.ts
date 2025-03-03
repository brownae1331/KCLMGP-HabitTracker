import { StyleSheet } from "react-native";

export const CalendarPageStyles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        gap: 8,
        padding: 16,
    },
    calendarContainer: {
        padding: 16,
    },
    statsContainer: {
        marginTop: 20,
        alignItems: "center",
        padding: 16,
        backgroundColor: "#1E1E1E",
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 5,
        elevation: 5,
    },
    habitsContainer: {
        marginTop: 10,
        alignItems: "center",
    },
    separator: {
        width: "100%",
        height: 1,
        backgroundColor: "#444444",
        marginVertical: 10,
    },
    progressContainer: {
        alignItems: "center",
        marginTop: 20,
    },
    progressTextContainer: {
        position: "absolute",
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between", // Aligns left and right
        paddingHorizontal: 20, // Adds spacing on both sides
        top: "45%", // Positions text correctly
    },
    percentageText: {
        color: "#FFD700",
        fontSize: 22,
        fontWeight: "bold",
    },
    fractionText: {
        color: "#FFF",
        fontSize: 18,
    },
});