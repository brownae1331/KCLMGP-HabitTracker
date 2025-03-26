import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, useWindowDimensions, Platform, Image } from 'react-native';
import { useTheme } from './ThemeContext';
import { getWeekDates } from '../utils/dateUtils';
import { useWeekCalendarStyles } from './styles/WeekCalendarStyles';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';

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
    const { width } = useWindowDimensions();
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const [weekIndex, setWeekIndex] = useState<number>(0);
    const [currentWeek, setCurrentWeek] = useState<DayType[]>(getWeekDates(0));

    const flatListRef = useRef<FlatList>(null);
    const userInteracted = useRef(false);
    const { theme } = useTheme();
    const styles = useWeekCalendarStyles();

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

        const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setWeekIndex(newIndex - 500);

        const newWeek = getWeekDates(newIndex - 500);
        const selected = newWeek.find(day => day.date === selectedDate.date) || newWeek[0];

        setSelectedDate({ date: selected.date, fullDate: new Date(selected.fullDate) });
    };

    return (
        <View style={[styles.calendarWrapper, { width: width }]}>
            {/* Web: Display Arrows */}
            {Platform.OS === 'web' ? (
                <View style={[styles.weekContainer, { width: width }]}>
                    <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.arrowButton}>
                    <Image source={require('../../assets/images/arrowLeft.png')}/>
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
                                style={styles.dayContainer}
                                onPress={() => setSelectedDate({ date, fullDate })}
                            >
                                <Text style={styles.dayText}>{day}</Text>

                                <View style={[isToday && styles.todayRing, isSelected && styles.selectedCircle]}>
                                    <ThemedText type="subtitle" style={{ color: Colors[theme].text }}>
                                        {date}
                                    </ThemedText>
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity onPress={() => changeWeek(1)} style={styles.arrowButton}>
                    <Image source={require('../../assets/images/arrowRight.png')} />
                    </TouchableOpacity>
                </View>
            ) : (
                // Mobile is swipeable
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
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    onMomentumScrollEnd={handleScrollEnd}
                    onTouchStart={() => (userInteracted.current = true)}
                    renderItem={({ item: week }: { item: DayType[] }) => (
                        <View style={[styles.weekContainer, { width: width }]}>
                            {week.map(({ day, date, fullDate }: DayType, index: number) => {
                                const isToday =
                                    date === todayDate &&
                                    fullDate.getMonth() === todayMonth &&
                                    fullDate.getFullYear() === todayYear;
                                const isSelected = selectedDate.date === date;

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dayContainer}
                                        onPress={() => setSelectedDate({ date, fullDate })}
                                    >
                                        <Text style={styles.dayText}>{day}</Text>

                                        <View style={[isToday && styles.todayRing, isSelected && styles.selectedCircle]}>
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
