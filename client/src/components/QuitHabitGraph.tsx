import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from './ThemeContext';
import { Colors } from './styles/Colors';

type Range = 'W' | 'M';

interface ChartData {
  x: string;
  y: number;
}

interface VicGraphProps {
    email: string;
    habitName: string;
  }

const VicGraph = ({ email, habitName }: VicGraphProps) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [range, setRange] = useState<Range>('W');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const currentDate = new Date();

  const labels: Record<Range, string[]> = {
    W: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    M: Array.from({ length: 31 }, (_, i) => (i + 1).toString()), // 1 to 31
  };

  // Simulate sample data
  const sampleData: Record<Range, number[]> = {
    W: [3, 4, 0, 6, 0, 1, 2], // 7 days
    M: Array(31)
      .fill(0)
      .map((_, i) => (i < currentDate.getDate() ? Math.random() * 5 + 1 : 0)),
  };

  useEffect(() => {
    if (!(range in labels)) {
      console.error(`Invalid range value: ${range}. Valid values are: ${Object.keys(labels).join(', ')}`);
      return;
    }

    const selectedLabels = labels[range];
    const selectedData = sampleData[range];

    if (!selectedLabels || !selectedData) {
      console.error('selectedLabels or selectedData is undefined', { selectedLabels, selectedData });
      return;
    }

    const newData = selectedLabels.map((label, index) => ({
      x: label,
      y: selectedData[index],
    }));
    setChartData(newData);
  }, [range]);

  const referenceWidth = 400;
  const baseLineWidth: Record<Range, number> = { W: 3, M: 2 };
  const dynamicLineWidth = baseLineWidth[range] * (Math.min(width, 600) / referenceWidth);
  const scaledLineWidth = Math.min(Math.max(dynamicLineWidth, baseLineWidth[range] * 0.3), baseLineWidth[range] * 0.8);

  const maxChartWidth = 600;
  const chartWidth = Math.min(width - 10, maxChartWidth);

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.pickerContainer, { backgroundColor: Colors[theme].background2 }]}>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.leftButton,
            range === 'W' && styles.activeButton,
          ]}
          onPress={() => setRange('W')}
        >
          <Text style={[styles.pickerText, { color: Colors[theme].text }]}>W</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.pickerButton,
            styles.rightButton,
            range === 'M' && styles.activeButton,
          ]}
          onPress={() => setRange('M')}
        >
          <Text style={[styles.pickerText, { color: Colors[theme].text }]}>M</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.date, { color: Colors[theme].text }]}>
        {range === 'W' ? 'Current Week' : 'Current Month'}
      </Text>

      <VictoryChart
        width={chartWidth}
        height={220}
        domainPadding={{ x: range === 'M' ? 5 : 20 }}
        padding={{ top: 20, bottom: 40, left: 40, right: 40 }}
        theme={VictoryTheme.material}
      >
        <VictoryAxis
          tickValues={labels[range]}
          tickFormat={(tick: string) => {
            if (range === 'M') {
              return [1, 8, 15, 22, 29].includes(parseInt(tick)) ? tick : '';
            }
            return tick;
          }}
          style={{
            axis: { stroke: Colors[theme].text },
            ticks: {
              stroke: Colors[theme].text,
              size: 5,
            },
            tickLabels: { fill: Colors[theme].text, fontSize: 10 },
            grid: {
              stroke: Colors[theme].border,
              strokeWidth: 0.5,
              strokeDasharray: '5,5',
            },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: Colors[theme].text },
            ticks: { stroke: Colors[theme].text, size: 5 },
            tickLabels: { fill: Colors[theme].text, fontSize: 10 },
            grid: {
              stroke: Colors[theme].border,
              strokeWidth: 0.5,
              strokeDasharray: '5,5',
            },
          }}
        />
        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: theme === 'light' ? '#0a7ea4' : '#00A3FF',
              strokeWidth: scaledLineWidth,
            },
          }}
          interpolation="linear"
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
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
    backgroundColor: '#00A3FF',
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

export default VicGraph;