import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../components/styles/Colors';
import { useTheme } from '../../../components/ThemeContext';
import { SharedStyles } from '../../../components/styles/SharedStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BuildHabitGraph from '../../../components/BuildHabitGraph';
import QuitHabitGraph from '../../../components/QuitHabitGraph';

type Habit = {
  habitName: string;
  habitType: 'build' | 'quit';
};

export default function StatsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const { theme } = useTheme();

  const habitButtonContainerStyle = {
    ...styles.habitButtonContainer,
    backgroundColor: theme === 'dark' ? Colors.dark.background2 : Colors.light.background2,
    borderColor: theme === 'dark' ? '#555555' : '#CCCCCCFF',
  };

  const habitButtonTextStyle = {
    ...styles.habitButtonText,
    color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const storedEmail = await AsyncStorage.getItem('email');
        console.log('Stored username:', storedUsername, 'Stored email:', storedEmail);
        if (storedUsername) setUsername(storedUsername);
        if (storedEmail) setEmail(storedEmail);
      } catch (error) {
        console.error('Error retrieving user data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  // temporary fake habits data
  useEffect(() => {
    const fakeHabits: Habit[] = [
      { habitName: 'Drink Water', habitType: 'build' },
      { habitName: 'Quit Smoking', habitType: 'quit' },
      { habitName: 'Exercise Daily for 30 Minutes', habitType: 'build' },
      { habitName: 'Drink Wate2r', habitType: 'build' },
      { habitName: 'Quit Smokin2g', habitType: 'quit' },
      { habitName: 'Exercise Da2ily for 30 Minutes', habitType: 'build' },
    ];
    setHabits(fakeHabits);
    setLoading(false);
  }, [username]);

  const onContainerLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  const selectedHabitData = habits.find(h => h.habitName === selectedHabit);

  const maxButtonsWithoutScrolling = 3;
  const shouldScroll = habits.length > maxButtonsWithoutScrolling;
  const buttonWidth = shouldScroll
    ? 120
    : containerWidth / Math.min(habits.length, maxButtonsWithoutScrolling);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text }}>Stats</ThemedText>
        </View>

        {habits.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <ThemedText type="subtitle">
              You don’t have any habits yet! Create a habit to see statistics.
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={habitButtonContainerStyle} onLayout={onContainerLayout}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={shouldScroll}
                contentContainerStyle={styles.habitButtonContentContainer}
              >
                {habits.map((habit, index) => {
                  const isSelected = selectedHabit === habit.habitName;
                  const isFirst = index === 0;
                  const isLast = index === habits.length - 1;

                  const buttonStyle = {
                    ...styles.habitButton,
                    width: buttonWidth,
                    backgroundColor: isSelected
                      ? '#00A3FF'
                      : theme === 'dark'
                      ? Colors.dark.background2
                      : Colors.light.background,
                    borderTopLeftRadius: isFirst ? 10 : 0,
                    borderBottomLeftRadius: isFirst ? 10 : 0,
                    borderTopRightRadius: isLast ? 10 : 0,
                    borderBottomRightRadius: isLast ? 10 : 0,
                  };

                  return (
                    <TouchableOpacity
                      key={habit.habitName}
                      style={buttonStyle}
                      onPress={() => setSelectedHabit(habit.habitName)}
                    >
                      <ThemedText
                        style={{
                          ...habitButtonTextStyle,
                          color: isSelected
                            ? '#ffffff'
                            : theme === 'dark'
                            ? Colors.dark.text
                            : Colors.light.text,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {habit.habitName}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {selectedHabit && selectedHabitData && email ? (
              selectedHabitData.habitType === 'build' ? (
                <BuildHabitGraph email={email} habitName={selectedHabit} />
              ) : (
                <QuitHabitGraph email={email} habitName={selectedHabit} />
              )
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ThemedText type="subtitle">Select a habit to see statistics about your progress!</ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  habitButtonContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  habitButtonContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  habitButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  habitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 100,
  },
});