import { StyleSheet } from 'react-native';

// Style definitions for the Account screen layout and components
export const AccountPageStyles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  changeButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#a39d41',
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000080',
  },
  modalContent: {
    width: 300,
    padding: 20,
    borderRadius: 10,
  },
  modalButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#a39d41',
    alignItems: 'center',
    borderRadius: 5,
  },
});
