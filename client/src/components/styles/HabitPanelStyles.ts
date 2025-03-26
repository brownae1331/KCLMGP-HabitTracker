import { StyleSheet } from 'react-native';

export const HabitPanelStyles = StyleSheet.create({
  habitPanel: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  habitDescription: {
    fontSize: 14,
    color: '#fff',
    marginVertical: 5,
  },
  updateStatus: {
    marginTop: 10,
    color: '#fff',
    fontStyle: 'italic',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireEmoji: {
    marginRight: 5,
  },
  streakCount: {
    color: '#a39d41',
    fontWeight: 'bold',
    marginRight: 8,
  },
  deleteButton: {
    padding: 10,
    backgroundColor: '#FF6B6B',
    borderRadius: 5,
    marginTop: 0,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  progressIndicator: {
    marginTop: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    alignItems: 'center',
  },
  futureMessage: {
    marginTop: 10,
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  deleteIcon: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 5,
    textAlign: 'center',
  },
});
