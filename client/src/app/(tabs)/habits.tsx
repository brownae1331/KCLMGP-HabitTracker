import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  View,
} from 'react-native';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { WeeklyCalendar } from '../../components/WeeklyCalendar';
import { SharedStyles } from '../../components/styles/SharedStyles';
import { NewHabitModal } from '../../components/NewHabitModal';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../components/styles/Colors';
import { useTheme } from '../../components/ThemeContext';
import { getHabitsByUser } from '../../lib/client';
import HabitPanel, { Habit } from '../../components/HabitPanel'; // adjust the path as needed


const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: Date }>({
    date: today.getDate(),
    fullDate: today
  });
  const [email, setEmail] = useState('');
  // State for modal and habit form
  const [modalVisible, setModalVisible] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [habitType, setHabitType] = useState<'build' | 'quit'>('build');
  const [habitColor, setHabitColor] = useState('#007AFF');

  // State for scheduling options
  const [scheduleOption, setScheduleOption] = useState<'interval' | 'weekly'>('interval');
  const [intervalDays, setIntervalDays] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Goal fields (only relevant for build type)
  const [isGoalEnabled, setIsGoalEnabled] = useState(false);
  const [goalValue, setGoalValue] = useState('');
  const [goalUnit, setGoalUnit] = useState('');

  // Example array of color swatches
  const colorOptions = [
    '#FF0000', // Red
    '#FF9500', // Orange
    '#FFCC00', // Yellow
    '#34C759', // Green
    '#007AFF', // Blue
    '#AF52DE', // Purple
    '#8E8E93', // Gray
  ];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddHabit = async () => {
    // Prepare the habit data object
    const newHabit = {
      email: email || 'abcdef@gmail.com', // Ensure email is set (using your dummy email here)
      habitName,
      habitDescription,
      habitType,
      habitColor,
      scheduleOption,
      intervalDays: intervalDays ? parseInt(intervalDays, 10) : null,
      selectedDays,
      isGoalEnabled,
      goalValue: goalValue ? parseFloat(goalValue) : null,
      goalUnit,
    };
  
    try {
      const response = await fetch('http://localhost:3000/habits', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });
      const data = await response.json();
      console.log('Habit added successfully:', data);
      // Optionally, refresh your habit list here
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  
    // Reset form values and close modal
    setEmail('abcdef@gmail.com'); // dummy email
    setHabitName('');
    setHabitDescription('');
    setHabitType('build');
    setHabitColor('#007AFF');
    setScheduleOption('interval');
    setIntervalDays('');
    setSelectedDays([]);
    setIsGoalEnabled(false);
    setGoalValue('');
    setGoalUnit('');
    setModalVisible(false);
  };
  
  const [dbHabits, setDbHabits] = useState<any[]>([]);

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const habits = await getHabitsByUser('abcdef@gmail.com');
  
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const selectedDayName = dayNames[selectedDate.fullDate.getDay()];
  
        const filtered = habits.filter((habit: any) => {
          if (habit.scheduleOption === 'weekly') {
            // For weekly habits, check if the selected day's name is in the selectedDays array.
            return habit.selectedDays && habit.selectedDays.includes(selectedDayName);
          } else {
            // For interval (or date-specific) habits, check the habit.date.
            if (!habit.date) return false;
            const habitDate = new Date(habit.date);
            return (
              habitDate.getDate() === selectedDate.fullDate.getDate() &&
              habitDate.getMonth() === selectedDate.fullDate.getMonth() &&
              habitDate.getFullYear() === selectedDate.fullDate.getFullYear()
            );
          }
        });
        setDbHabits(filtered);
      } catch (error) {
        console.error('Error fetching habits for selected date:', error);
      }
    };
  
    fetchHabits();
  }, [selectedDate]);
  

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background }}>

        {/* Today/Selected Date */}
        <View style={[SharedStyles.titleContainer, { backgroundColor: Colors[theme].background }]}>
          <ThemedText type="title" style={{ color: Colors[theme].text, textAlign: 'center', width: '100%' }}>
            {selectedDate.date === today.getDate()
              ? "Today"
              : selectedDate.fullDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </ThemedText>
        </ThemedView>

        <ThemedView>
          {dbHabits.length > 0 ? (
            dbHabits.map((habit: Habit) => (
              <HabitPanel key={'$habit.email}-${habit.habitName'} habit={habit} />
            ))
          ) : (
            <ThemedText>No habits found for this date.</ThemedText>
          )}
        </ThemedView>


        {/* Add Habit Button */}
        <View style={[SharedStyles.addButtonContainer, { backgroundColor: Colors[theme].background }]}>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <IconSymbol name="plus" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* New Habit Modal */}
        <NewHabitModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          habitName={habitName}
          setHabitName={setHabitName}
          habitDescription={habitDescription}
          setHabitDescription={setHabitDescription}
          habitType={habitType}
          setHabitType={setHabitType}
          habitColor={habitColor}
          setHabitColor={setHabitColor}
          scheduleOption={scheduleOption}
          setScheduleOption={setScheduleOption}
          intervalDays={intervalDays}
          setIntervalDays={setIntervalDays}
          selectedDays={selectedDays}
          setSelectedDays={setSelectedDays}
          isGoalEnabled={isGoalEnabled}
          setIsGoalEnabled={setIsGoalEnabled}
          goalValue={goalValue}
          setGoalValue={setGoalValue}
          goalUnit={goalUnit}
          setGoalUnit={setGoalUnit}
          onAddHabit={handleAddHabit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* Slider Component (unchanged) */
interface HabitTypeSliderProps {
  habitType: 'build' | 'quit';
  setHabitType: (value: 'build' | 'quit') => void;
}

const HabitTypeSlider: React.FC<HabitTypeSliderProps> = ({
  habitType,
  setHabitType,
}) => {
  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        style={[
          styles.sliderOption,
          habitType === 'build' && styles.selectedOption,
        ]}
        onPress={() => setHabitType('build')}
      >
        <ThemedText
          style={[
            styles.sliderOptionText,
            habitType === 'build' && styles.selectedOptionText,
            styles.textDark,
          ]}
        >
          Build
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.sliderOption,
          habitType === 'quit' && styles.selectedOption,
        ]}
        onPress={() => setHabitType('quit')}
      >
        <ThemedText
          style={[
            styles.sliderOptionText,
            habitType === 'quit' && styles.selectedOptionText,
            styles.textDark,
          ]}
        >
          Quit
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};



// Function to get the current weeks dates based on the week index
const getWeekDates = (weekIndex: number): { day: string; date: number; fullDate: Date }[] => {
  const today = new Date();

  today.setDate(today.getDate() + weekIndex * 7);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Set Sunday as the first day of the week
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay());

  // Loop over weekDays array to get the full weeks dates
  return weekDays.map((day, index) => {
    const date = new Date(firstDayOfWeek);
    date.setDate(firstDayOfWeek.getDate() + index);
    return {
      day,
      date: date.getDate(),
      fullDate: new Date(date),
    };
  });
};

/**
 * WeeklyCalendar Component
 * Displays an interactive weekly calendar at the top of the screen
 */
interface WeeklyCalendarProps {
  selectedDate: { date: number; fullDate: Date };
  setSelectedDate: React.Dispatch<React.SetStateAction<{ date: number; fullDate: Date }>>;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  selectedDate,
  setSelectedDate,
}) => {
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const initialized = useRef(false);
  const userInteracted = useRef(false);

  // When the app first opens, Today will be the automatically selected day
  React.useEffect(() => {
    if (!initialized.current) {
      setSelectedDate({ date: todayDate, fullDate: today });
      initialized.current = true;
    }
  }, [setSelectedDate, todayDate, today]);

  // Keeps track of which week the user is viewing
  const handleScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (!initialized.current || !userInteracted.current) return;

    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setWeekIndex(newIndex - 500);

    // When swiping between weeks, Saturday is automatically selected
    const newWeek = getWeekDates(newIndex - 500);
    const saturday = newWeek.find((day) => day.day === "Sa");
    if (saturday) {
      setSelectedDate({ date: saturday.date, fullDate: new Date(saturday.fullDate) });
    }
  };

  return (
    <View style={styles.calendarWrapper}>
      {/* Weekly calendar */}
      <FlatList
        testID="weekly-calendar-list"
        ref={flatListRef}
        data={[...Array(1000)].map((_, i) => getWeekDates(i - 500))}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={500}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={handleScrollEnd}
        onTouchStart={() => (userInteracted.current = true)}
        renderItem={({ item: week }: { item: { day: string; date: number; fullDate: Date }[] }) => (
          <View style={styles.weekContainer}>
            {week.map(({ day, date, fullDate }, index) => {
              const isToday =
                date === todayDate &&
                fullDate.getMonth() === todayMonth &&
                fullDate.getFullYear() === todayYear;
              const isSelected = selectedDate.date === date;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.dayContainer}
                  onPress={() => {
                    userInteracted.current = true;
                    setSelectedDate({ date, fullDate });
                  }}
                >
                  {/* Day e.g. Mo, Tu */}
                  <Text style={styles.dayText}>{day}</Text>

                  {/* Styles for today and selected date */}
                  <View style={[isToday && styles.todayRing, isSelected && styles.selectedCircle]}>
                    <Text style={[styles.dateText, isSelected && styles.selectedText]}>
                      {date}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  selectedDateText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  calendarWrapper: {
    width: SCREEN_WIDTH,
    overflow: "hidden",
  },
  calendarContainer: {
    flexDirection: "row",
    width: SCREEN_WIDTH * 3,
    alignItems: "center",
    justifyContent: "center",
  },
  weekContainer: {
    width: SCREEN_WIDTH,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  today: {
    backgroundColor: '#007AFF',
  },
  selectedDay: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
  },
  textDark: {
    color: '#333333',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF9800",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  todayRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    marginTop: 20,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  descriptionInput: {
    // Give a bit more room for multiline text
    height: 60,
    textAlignVertical: 'top',
  },
  sliderContainer: {
    flexDirection: 'row',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 25,
    overflow: 'hidden',
  },
  sliderOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  sliderOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  sectionLabel: {
    marginBottom: 4,
    fontWeight: '500',
  },
  picker: {
    width: '100%',
    backgroundColor: '#000',
    marginBottom: 0,
    color: '#333333',
  },
  intervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  daysText: {
    marginLeft: 8,
  },
  weeklyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    margin: 4,
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    color: '#007AFF',
  },
  selectedDayButtonText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
  },
  // Horizontal scroll container for color swatches
  colorPickerContainer: {
    paddingVertical: 8,
  },
  // Individual color swatch
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  // Highlight the chosen color
  selectedSwatch: {
    borderColor: '#007AFF',
  },
  // Goal Section
  goalToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  goalFieldsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
});
