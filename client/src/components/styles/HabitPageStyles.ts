import { StyleSheet } from 'react-native';

// Style definitions for the Habit page, including habit list layout and empty state text
export const HabitPageStyles = StyleSheet.create({
  habitListContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
  },
  noHabitsText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#a39d41',
  },
});
