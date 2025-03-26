import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryScatter } from 'victory-native';
import { useWindowDimensions } from 'react-native';
import { useTheme } from './ThemeContext';
import { Colors } from './styles/Colors';
import { fetchStreak, fetchLongestStreak, fetchCompletionRate } from '../lib/client';
import StatsBoxes from './StatsBoxes';

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
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [completionRate, setCompletionRate] = useState<number>(0);

  const labels: Record<Range, string[]> = {
    W: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    M: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawData = await fetchStreak(email, habitName, range === 'W' ? 'week' : 'month');
  
        const today = new Date();
        const startDate = new Date(today);
        if (range === 'W') {
          startDate.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        } else {
          startDate.setDate(1);
        }
        
        const newData = rawData.map((entry: { progressDate: string; streak: number }) => {
          const date = new Date(entry.progressDate);
          if (range === 'W') {
            const dayIndex = (date.getDay() + 6) % 7;
            return { x: labels[range][dayIndex], y: entry.streak };
          }
          return { x: date.getDate().toString(), y: entry.streak };
        });
  
        setChartData(newData);
        const mostRecentEntry = rawData[rawData.length - 1];
        setCurrentStreak(mostRecentEntry ? mostRecentEntry.streak : 0); 
      } catch (error) {
        console.error('Error fetching streak data:', error);
      }
    };

    fetchData();
  }, [range, email, habitName]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const longestStreak = await fetchLongestStreak(email, habitName);
        setLongestStreak(longestStreak);

        const completionRate = await fetchCompletionRate(email, habitName);
        setCompletionRate(completionRate);
      } catch (error) {
      }
    };

    fetchStats();
  }, [email, habitName]);

  const getGrade = (rate: number): string => {
    if (rate >= 90) return 'A';
    if (rate >= 75) return 'B';
    if (rate >= 60) return 'C';
    if (rate >= 45) return 'D';
    return 'F';
  };

  const referenceWidth = 400;
  const baseLineWidth: Record<Range, number> = { W: 3, M: 2 };
  const dynamicLineWidth = baseLineWidth[range] * (Math.min(width, 600) / referenceWidth);
  const scaledLineWidth = Math.min(Math.max(dynamicLineWidth, baseLineWidth[range] * 0.3), baseLineWidth[range] * 0.8);

  const chartWidth = Math.min(width - 10, 600);

  const axisStyle = {
    axis: { stroke: Colors[theme].text },
    ticks: { stroke: Colors[theme].text, size: 5 },
    tickLabels: { fill: Colors[theme].text, fontSize: 10 },
    grid: { stroke: Colors[theme].border, strokeWidth: 0.5, strokeDasharray: '5,5' },
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: Colors[theme].graphBackground }]}>
        <View style={[styles.pickerContainer, { backgroundColor: Colors[theme].pickerBackground }]}>
          {(['W', 'M'] as Range[]).map((r, index) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.pickerButton,
                index === 0 && styles.leftButton,
                index === 1 && styles.rightButton,
                range === r && styles.activeButton,
              ]}
              onPress={() => setRange(r)}
            >
              <Text style={[styles.pickerText, { color: Colors[theme].text }]}>{r}</Text>
            </TouchableOpacity>
          ))}
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
            style={axisStyle}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(tick: number) => Math.round(tick)}
            style={axisStyle}
          />
          <VictoryLine
            data={chartData}
            style={{ data: { stroke: '#a39d41', strokeWidth: scaledLineWidth }}}
            interpolation="linear"
          />
          <VictoryScatter
            data={chartData}
            size={3.5}
            style={{ data: { fill: '#B7AF3DFF', stroke: '#B7AF3D8B', strokeWidth: 1 } }}
          />
        </VictoryChart>
      </View>
      <StatsBoxes
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        completionRate={completionRate}
        fourthStat={{ label: 'Grade', value: getGrade(completionRate) }}
      />
    </>
  );
};

const styles = StyleSheet.create({
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

export default QuitHabitGraph;