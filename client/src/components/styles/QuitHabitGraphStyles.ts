import { StyleSheet } from 'react-native';

export const QuitHabitGraphStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    borderRadius: 10,
  },
  pickerContainer: {
    flexDirection: 'row',
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightButton: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  activeButton: {
    backgroundColor: '#a39d41',
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    marginBottom: 10,
  },
});
