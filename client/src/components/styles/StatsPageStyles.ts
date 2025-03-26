import { StyleSheet } from 'react-native';

export const StatsPageStyles = StyleSheet.create({
  pickerContainer: {
    width: '80%',
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 11,
    overflow: 'hidden',
    borderWidth: 1,
  },
  picker: {
    height: 50,
    borderRadius: 10,
  },
  graphContainer: {
    marginHorizontal: 30,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  messageContainer: {
    alignSelf: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 10,
    padding: 20,
  },
  messageText: {
    fontSize: 20,
    textAlign: 'center',
    maxWidth: 400,
    color: '#808080',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 50
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16
  },
});
