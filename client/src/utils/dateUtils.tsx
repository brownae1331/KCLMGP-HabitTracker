export const getWeekDates = (weekIndex: number): { day: string; date: number; fullDate: Date }[] => {
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