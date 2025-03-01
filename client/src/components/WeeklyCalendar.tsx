import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { getWeekDates } from '../utils/dateUtils';
import { WeekCalendarStyles } from './styles/WeekCalendarStyles';
import { ThemedText } from './ThemedText';
import { Colors } from './styles/Colors';
import { useTheme } from './ThemeContext';

const SCREEN_WIDTH = Dimensions.get("window").width;

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
    const { theme } = useTheme();

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
        <View style={WeekCalendarStyles.calendarWrapper}>
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
                    <View style={WeekCalendarStyles.weekContainer}>
                        {week.map(({ day, date, fullDate }, index) => {
                            const isToday =
                                date === todayDate &&
                                fullDate.getMonth() === todayMonth &&
                                fullDate.getFullYear() === todayYear;
                            const isSelected = selectedDate.date === date;

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={WeekCalendarStyles.dayContainer}
                                    onPress={() => {
                                        userInteracted.current = true;
                                        setSelectedDate({ date, fullDate });
                                    }}
                                >
                                    {/* Day e.g. Mo, Tu */}
                                    <Text style={WeekCalendarStyles.dayText}>{day}</Text>

                                    {/* Styles for today and selected date */}
                                    <View style={[
                                        isToday && !isSelected && WeekCalendarStyles.todayRing,
                                        isSelected && WeekCalendarStyles.selectedCircle,
                                        isToday && isSelected && WeekCalendarStyles.selectedCircle,
                                    ]}>
                                        <ThemedText
                                            type="defaultSemiBold"
                                            style={{
                                                color: Colors[theme].text
                                            }}
                                        >
                                            {date}
                                        </ThemedText>
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