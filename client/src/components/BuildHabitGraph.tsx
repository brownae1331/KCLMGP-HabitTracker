import React, { useState, useCallback } from 'react';
import { View, TouchableOpacity, Text, useWindowDimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from './ThemeContext';
import { Colors } from './styles/Colors';
import { BuildHabitGraphStyles } from './styles/BuildHabitGraphStyles';
import { fetchBuildHabitProgress, fetchStreak, fetchLongestStreak, fetchCompletionRate, fetchAverageProgress } from '../lib/client'
import StatsBoxes from './StatsBoxes';

type Range = 'W' | 'M' | 'Y';

interface ChartData {
  x: string;
  y: number;
}

interface BuildHabitGraphProps {
  email: string;
  habitName: string;
}

// Displays a bar chart of build-type habit progress over time (week, month, or year)
const BuildHabitGraph = ({ email, habitName }: BuildHabitGraphProps) => {
  const { width } = useWindowDimensions();
  const { theme } = useTheme();
  const [range, setRange] = useState<Range>('W');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hasDecimals, setHasDecimals] = useState(false);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [averageProgress, setAverageProgress] = useState<number>(0);
  const today = new Date();

  const labels: Record<Range, string[]> = {
    W: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    M: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
    Y: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  const fetchChartData = async () => {
    try {
      const rawData = await fetchBuildHabitProgress(email, habitName, range === 'W' ? 'week' : range === 'M' ? 'month' : 'year');

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
      console.error('Error fetching chart data:', error);
      setChartData(labels[range].map(label => ({ x: label, y: 0 })));
    }
  };

  const fetchStreakData = async () => {
    try {
      const rawData = await fetchStreak(email, habitName, 'week');
      const mostRecentEntry = rawData[rawData.length - 1];
      setCurrentStreak(mostRecentEntry ? mostRecentEntry.streak : 0);
    } catch (error) {
      console.error('Error fetching streak data:', error);
      setCurrentStreak(0);
    }
  };

  const fetchStats = async () => {
    try {
      const longestStreak = await fetchLongestStreak(email, habitName);
      setLongestStreak(longestStreak);

      const completionRate = await fetchCompletionRate(email, habitName);
      setCompletionRate(completionRate);

      const averageProgress = await fetchAverageProgress(email, habitName);
      setAverageProgress(averageProgress);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLongestStreak(0);
      setCompletionRate(0);
      setAverageProgress(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChartData();
      fetchStreakData();
      fetchStats();
    }, [range, email, habitName])
  );

  const referenceWidth = 400;
  const baseBarWidth = { W: 15, M: 5, Y: 10 };
  const dynamicBarWidth = baseBarWidth[range] * (Math.min(width, 600) / referenceWidth);
  const scaledBarWidth = Math.min(Math.max(dynamicBarWidth, baseBarWidth[range] * 0.5), baseBarWidth[range] * 1.5);

  const maxChartWidth = 600;
  const chartWidth = Math.min(width - 10, maxChartWidth);

  const axisStyle = {
    axis: { stroke: Colors[theme].text },
    ticks: { stroke: Colors[theme].text, size: 5 },
    tickLabels: { fill: Colors[theme].text, fontSize: 10 },
    grid: { stroke: Colors[theme].border, strokeWidth: 0.5, strokeDasharray: '5,5' },
  };

  return (
    <>
      <View style={[BuildHabitGraphStyles.container, { backgroundColor: Colors[theme].graphBackground }]}>
        <View style={[BuildHabitGraphStyles.pickerContainer, { backgroundColor: Colors[theme].pickerBackground }]}>
          {(['W', 'M', 'Y'] as Range[]).map((r, index) => (
            <TouchableOpacity
              key={r}
              style={[
                BuildHabitGraphStyles.pickerButton,
                index === 0 && BuildHabitGraphStyles.leftButton,
                index === 2 && BuildHabitGraphStyles.rightButton,
                range === r && BuildHabitGraphStyles.activeButton,
              ]}
              onPress={() => setRange(r)}
            >
              <Text style={[BuildHabitGraphStyles.pickerText, { color: Colors[theme].text }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[BuildHabitGraphStyles.date, { color: Colors[theme].text }]}>
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
            tickFormat={(tick: string) => (range === 'M' && ![1, 8, 15, 22, 29].includes(parseInt(tick)) ? '' : tick)}
            style={axisStyle}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(tick: number) => (hasDecimals ? tick.toFixed(1) : Math.round(tick))}
            style={axisStyle}
          />
          <VictoryBar
            data={chartData}
            style={{
              data: {
                fill: '#a39d41',
                width: scaledBarWidth,
              },
            }}
          />
        </VictoryChart>
        
      </View>
      <StatsBoxes
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          completionRate={completionRate}
          fourthStat={{ label: 'Average Progress', value: `${averageProgress}` }}
        />
    </>
  );
};

export default BuildHabitGraph;