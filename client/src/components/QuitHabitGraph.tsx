import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryScatter } from 'victory-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from './ThemeContext';
import { Colors } from './styles/Colors';

type Range = 'W' | 'M';

interface ChartData {
  x: string;
  y: number;
}

interface QuitHabitGraphProps {
  email: string;
  habitName: string;
}

const QuitHabitGraph = ({ email, habitName }: QuitHabitGraphProps) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [range, setRange] = useState<Range>('W');
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const labels: Record<Range, string[]> = {
    W: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    M: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/stats/${email}/${habitName}/streak?range=${range === 'W' ? 'week' : 'month'}`
        );
        const rawData = await response.json();

        const today = new Date();
        const startDate = new Date(today);
        if (range === 'W') {
          startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        } else {
          startDate.setDate(1);
        }

        // Map only the actual due dates
        const newData = rawData.map((entry: { progressDate: string; streak: number }) => {
          const date = new Date(entry.progressDate);
          if (range === 'W') {
            const dayIndex = (date.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
            return { x: labels[range][dayIndex], y: entry.streak };
          } else {
            return { x: date.getDate().toString(), y: entry.streak };
          }
        });

        if (range === 'W') {
          const paddedData = labels['W'].map(label => {
            const found = newData.find((d: { x: string; }) => d.x === label);
            return found || { x: label, y: 0 };
          });
          setChartData(paddedData);
        } else {
          setChartData(newData);
        }
        
      } catch (error) {
        console.error('Error fetching streak data:', error);
      }
    };

    fetchData();
  }, [range, email, habitName]);

  const referenceWidth = 400;
  const baseLineWidth: Record<Range, number> = { W: 3, M: 2 };
  const dynamicLineWidth = baseLineWidth[range] * (Math.min(width, 600) / referenceWidth);
  const scaledLineWidth = Math.min(Math.max(dynamicLineWidth, baseLineWidth[range] * 0.3), baseLineWidth[range] * 0.8);

  const chartWidth = Math.min(width - 10, 600);

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
        domainPadding={{ x: range === 'M' ? 5 : 20, y: 10 }}
        padding={{ top: 20, bottom: 40, left: 40, right: 40 }}
        theme={VictoryTheme.material}
        domain={{ y: [0, Math.max(5, ...chartData.map(d => d.y + 1))] }}
      >
        <VictoryAxis
          tickValues={labels[range]}
          tickFormat={(tick: string) => (range === 'M' && ![1, 8, 15, 22, 29].includes(parseInt(tick)) ? '' : tick)}
          style={{
            axis: { stroke: Colors[theme].text },
            ticks: { stroke: Colors[theme].text, size: 5 },
            tickLabels: { fill: Colors[theme].text, fontSize: 10 },
            grid: { stroke: Colors[theme].border, strokeWidth: 0.5, strokeDasharray: '5,5' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(tick: number) => Math.round(tick)}
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
              stroke: '#0a7ea4',
              strokeWidth: scaledLineWidth,
            },
          }}
          interpolation="linear"
        />
        <VictoryScatter
          data={chartData}
          size={3.5}
          style={{
            data: { fill: '#139CC9FF', stroke: '#139CC985', strokeWidth: 1, },
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

export default QuitHabitGraph;