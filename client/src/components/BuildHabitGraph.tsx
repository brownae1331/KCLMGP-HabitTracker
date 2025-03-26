import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from './ThemeContext';
import { Colors } from './styles/Colors';
import { BASE_URL } from '../lib/client';


type Range = 'W' | 'M' | 'Y';

interface ChartData {
  x: string;
  y: number;
}

interface BuildHabitGraphProps {
    email: string;
    habitName: string;
  }

const BuildHabitGraph = ({ email, habitName }: BuildHabitGraphProps) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [range, setRange] = useState<Range>('W');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hasDecimals, setHasDecimals] = useState(false);
  const today = new Date();

  const labels: Record<Range, string[]> = {
    W: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    M: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
    Y: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/stats/${email}/${habitName}/progress?range=${range === 'W' ? 'week' : range === 'M' ? 'month' : 'year'}`
        );
        const rawData = await response.json();
        
        const startDate = new Date(today);
        if (range === 'W') {
          startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        } else if (range === 'M') {
          startDate.setDate(1);
        } else {
          startDate.setFullYear(today.getFullYear(), 0, 1);
        }

        let newData: ChartData[];
        if (range === 'W' || range === 'M') {
          const dataMap = new Map();
          rawData.forEach((entry: { progressDate: string; progress: number }) => {
            const date = new Date(entry.progressDate);
            let x;
            if (range === 'W') {
              const dayIndex = (date.getDay() + 6) % 7;
              x = labels[range][dayIndex];
            } else {
              x = date.getDate().toString();
            }
            dataMap.set(x, entry.progress);
          });

          newData = labels[range].map(label => ({
            x: label,
            y: dataMap.has(label) ? dataMap.get(label) : 0,
          }));
        } else {
          const dataMap = new Map();
          rawData.forEach((entry: { month: number; avgProgress: number }) => {
            const monthIndex = entry.month - 1;
            const x = labels[range][monthIndex];
            dataMap.set(x, entry.avgProgress);
          });

          newData = labels[range].map(label => ({
            x: label,
            y: dataMap.has(label) ? dataMap.get(label) : 0,
          }));
        }

        const hasDecimalValues = newData.some(data => data.y % 1 !== 0);
        setHasDecimals(hasDecimalValues);
        setChartData(newData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      }
    };

    fetchData();
  }, [range, email, habitName]);

  const referenceWidth = 400;
  const baseBarWidth = { W: 15, M: 5, Y: 10 };
  const dynamicBarWidth = baseBarWidth[range] * (Math.min(width, 600) / referenceWidth);
  const scaledBarWidth = Math.min(Math.max(dynamicBarWidth, baseBarWidth[range] * 0.5), baseBarWidth[range] * 1.5);

  const maxChartWidth = 600;
  const chartWidth = Math.min(width - 10, maxChartWidth);

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.pickerContainer, { backgroundColor: Colors[theme].background2 }]}>
        <TouchableOpacity
          style={[styles.pickerButton, styles.leftButton, range === 'W' && styles.activeButton]}
          onPress={() => setRange('W')}
        >
          <Text style={[styles.pickerText, { color: Colors[theme].text }]}>W</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pickerButton, range === 'M' && styles.activeButton]}
          onPress={() => setRange('M')}
        >
          <Text style={[styles.pickerText, { color: Colors[theme].text }]}>M</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.pickerButton, styles.rightButton, range === 'Y' && styles.activeButton]}
          onPress={() => setRange('Y')}
        >
          <Text style={[styles.pickerText, { color: Colors[theme].text }]}>Y</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.date, { color: Colors[theme].text }]}>
        {range === 'W' ? 'Current Week' : range === 'M' ? `Current Month` : today.getFullYear().toString()}
      </Text>

      <VictoryChart
        width={chartWidth}
        height={220}
        domainPadding={{ x: range === 'M' ? 5 : 20, y: 10 }}
        padding={{ top: 20, bottom: 40, left: 40, right: 40 }}
        theme={VictoryTheme.material}
        domain={{ y: [0, Math.max(5, ...chartData.map(d => d.y))] }}
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
            ticks: { stroke: Colors[theme].text, size: 5 },
            tickLabels: { fill: Colors[theme].text, fontSize: 10 },
            grid: { stroke: Colors[theme].border, strokeWidth: 0.5, strokeDasharray: '5,5' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick: number) => (hasDecimals ? tick.toFixed(1) : Math.round(tick))}
          style={{
            axis: { stroke: Colors[theme].text },
            ticks: { stroke: Colors[theme].text, size: 5 },
            tickLabels: { fill: Colors[theme].text, fontSize: 10 },
            grid: { stroke: Colors[theme].border, strokeWidth: 0.5, strokeDasharray: '5,5' },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: {
              fill: '#0a7ea4',
              width: scaledBarWidth,
            },
          }}
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

export default BuildHabitGraph;