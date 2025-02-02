import { StyleSheet, Platform, View, Text, TouchableOpacity, SafeAreaView, FlatList, Dimensions } from 'react-native';
import React, { useState, useRef } from 'react';
import { IconSymbol } from '@/components/ui/IconSymbol';

const SCREEN_WIDTH = Dimensions.get("window").width; 

export default function HomeScreen() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<{ date: number; fullDate: Date }>({ 
    date: today.getDate(), 
    fullDate: today 
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Display Today/Selected Date */}
      <Text style={styles.selectedDateText}>
        {selectedDate.date === today.getDate()
          ? "Today"
          : selectedDate.fullDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </Text>

      {/* Weekly Calendar */}
      <WeeklyCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

      {/* Add Button */}
      <View style={styles.addButtonContainer}>
        <IconSymbol name="plus" size={24} color="#007AFF" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    alignItems: "center",
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
  },
  addButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    marginTop: 20,
  },
});

// Function to get the current weeks dates
const getWeekDates = (weekIndex: number): { day: string; date: number; fullDate: Date }[] => {
  const today = new Date();
  today.setDate(today.getDate() + weekIndex * 7);
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay());

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

// Weekly Caldenar and swiping functionality
const WeeklyCalendar = ({
  selectedDate,
  setSelectedDate,
}: {
  selectedDate: { date: number; fullDate: Date };
  setSelectedDate: React.Dispatch<React.SetStateAction<{ date: number; fullDate: Date }>>;
}) => {
  const [weekIndex, setWeekIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const initialized = useRef(false);
  const userInteracted = useRef(false);

  // When the app first opens Today will be the automatically selected day
  React.useEffect(() => {
    if (!initialized.current) {
      setSelectedDate({ date: todayDate, fullDate: today });
      initialized.current = true;
    }
  }, [setSelectedDate, todayDate, today]);

  const handleScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    if (!initialized.current || !userInteracted.current) return; 
    
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setWeekIndex(newIndex - 500);

    // When swiping between weeks, Sat will be the automatically selected day
    const newWeek = getWeekDates(newIndex - 500);
    const saturday = newWeek.find((day) => day.day === "Sa");
    if (saturday) {
      setSelectedDate({ date: saturday.date, fullDate: new Date(saturday.fullDate) });
    }
  };

  return (
    <View style={styles.calendarWrapper}>
      <FlatList
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
                  <Text style={styles.dayText}>{day}</Text>
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
