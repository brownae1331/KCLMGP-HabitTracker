import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GoodHabitGraph = () => {
  const data = [50, 80, 100, 120, 60, 90, 110]; // Fake progess for each day
  const target = 100; // Target completion level (100%)
  const maxHeight = 150; // Max bar height in pixels

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Habit Summary</Text>
      
      <View style={[styles.yAxisContainer, {height: maxHeight,}]}>
        {[150, 125, 100, 75, 50, 25, 0].map((value) => (
          <Text key={value} style={styles.yAxisLabel}>{value}%</Text>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <View style={[styles.targetLine, { bottom: (target / 150) * maxHeight }]} />
        
        {data.map((value, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={[styles.bar, { height: (value / 150) * maxHeight }]} />
          </View>
        ))}

        <View style={styles.labelContainer}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <Text key={index} style={styles.label}>{day}</Text>
          ))}
        </View>
      </View>
    </View>
  );
};

//<Text style={styles.label}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>

const styles = StyleSheet.create({
  container: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0570B3',
    marginBottom: 10,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 10,
    bottom: 0,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#AAB1B5',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '80%',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#AAB1B5',
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    width: 30,
    backgroundColor: '#0570B3',
    borderRadius: 5,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: -20,
    right: '0%',
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    color: 'black',
  },
  targetLine: {
    borderRadius: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#AAB1B5',
    marginTop: 150,
    //marginHorizontal: 20,
    position: 'absolute',
    width: '100%',
    height: 1,
  },
});

export default GoodHabitGraph;