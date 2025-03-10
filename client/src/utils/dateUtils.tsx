export const getWeekDates = (offset = 0) => {
    const today = new Date();
    today.setDate(today.getDate() + offset * 7);

    const dayOfWeek = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    return [...Array(7)].map((_, i) => {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);

        return {
            day: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][i],
            date: date.getDate(),
            fullDate: date,
        };
    });
};
