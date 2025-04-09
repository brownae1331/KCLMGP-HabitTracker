import { StyleSheet } from 'react-native';

// Styles for the StatsBox layout and statistic display boxes
export const StatsBoxesStyles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: '5%',
    paddingHorizontal: '5%',
    paddingBottom: '5%',
    borderRadius: 8,
  },
  statBox: {
    width: '45%',
    borderRadius: 8,
    padding: 15,
    marginBottom: '5%',
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
});
