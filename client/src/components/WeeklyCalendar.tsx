import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions, Platform } from 'react-native';
import { useTheme } from './ThemeContext';
import { getWeekDates } from '../utils/dateUtils';
import { WeekCalendarStyles } from './styles/WeekCalendarStyles';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';

const SCREEN_WIDTH = Dimensions.get("window").width;

interface WeeklyCalendarProps {
    selectedDate: { date: number; fullDate: Date };
    setSelectedDate: React.Dispatch<React.SetStateAction<{ date: number; fullDate: Date }>>;
}

interface DayType {
    day: string;
    date: number;
    fullDate: Date;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ selectedDate, setSelectedDate }) => {
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const [weekIndex, setWeekIndex] = useState<number>(0);
    const [currentWeek, setCurrentWeek] = useState<DayType[]>(getWeekDates(0));

    const flatListRef = useRef<FlatList>(null);
    const userInteracted = useRef(false);
    const { theme } = useTheme();

    // Make sure the calendar starts with todays week
    useEffect(() => {
        setSelectedDate({ date: todayDate, fullDate: today });

        if (Platform.OS !== 'web') {
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({ index: 500, animated: false });
                }
            }, 100);
        }
    }, []);

    // Function to update week (for web)
    const changeWeek = (direction: number) => {
        const newIndex = weekIndex + direction;
        setWeekIndex(newIndex);
        const newWeek = getWeekDates(newIndex);
        setCurrentWeek(newWeek);

        // Maintain selected date when moving between weeks
        const selected = newWeek.find(day => day.date === selectedDate.date) || newWeek[0];
        setSelectedDate({ date: selected.date, fullDate: new Date(selected.fullDate) });
    };

    // Handles swiping between weeks (only for phone app)
    const handleScrollEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        if (!userInteracted.current) return;

        const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setWeekIndex(newIndex - 500);

        const newWeek = getWeekDates(newIndex - 500);
        const selected = newWeek.find(day => day.date === selectedDate.date) || newWeek[0];

        setSelectedDate({ date: selected.date, fullDate: new Date(selected.fullDate) });
    };

    return (
        <View style={WeekCalendarStyles.calendarWrapper}>
            {/* Web: Display Arrows */}
            {Platform.OS === 'web' ? (
                <View style={WeekCalendarStyles.weekContainer}>
                    <TouchableOpacity onPress={() => changeWeek(-1)} style={WeekCalendarStyles.arrowButton}>
                        <Text style={{ fontSize: 20 }}>{"<"}</Text>
                    </TouchableOpacity>

                    {currentWeek.map(({ day, date, fullDate }: DayType, index: number) => {
                        const isToday =
                            date === todayDate &&
                            fullDate.getMonth() === todayMonth &&
                            fullDate.getFullYear() === todayYear;
                        const isSelected = selectedDate.date === date;

                        return (
                            <TouchableOpacity
                                key={index}
                                style={WeekCalendarStyles.dayContainer}
                                onPress={() => setSelectedDate({ date, fullDate })}
                            >
                                <Text style={WeekCalendarStyles.dayText}>{day}</Text>

                                <View style={[isToday && WeekCalendarStyles.todayRing, isSelected && WeekCalendarStyles.selectedCircle]}>
                                    <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                                        {date}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity onPress={() => changeWeek(1)} style={WeekCalendarStyles.arrowButton}>
                        <Text style={{ fontSize: 20 }}>{">"}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // Phone is swipeable
                <FlatList
                    ref={flatListRef}
                    testID='weekly-calendar-list'
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
                    renderItem={({ item: week }: { item: DayType[] }) => (
                        <View style={WeekCalendarStyles.weekContainer}>
                            {week.map(({ day, date, fullDate }: DayType, index: number) => {
                                const isToday =
                                    date === todayDate &&
                                    fullDate.getMonth() === todayMonth &&
                                    fullDate.getFullYear() === todayYear;
                                const isSelected = selectedDate.date === date;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={WeekCalendarStyles.dayContainer}
                                        onPress={() => setSelectedDate({ date, fullDate })}
                                    >
                                        <Text style={WeekCalendarStyles.dayText}>{day}</Text>

                                        <View style={[isToday && WeekCalendarStyles.todayRing, isSelected && WeekCalendarStyles.selectedCircle]}>
                                            <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                                                {date}
                                            </ThemedText>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                />
            )}
        </View>
    );
};
