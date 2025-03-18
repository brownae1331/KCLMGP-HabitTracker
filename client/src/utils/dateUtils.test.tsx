import { getWeekDates } from './dateUtils';

describe('getWeekDates', () => {
    test('should return an array of 7 days starting from Sunday', () => {
        const weekDates = getWeekDates();
        expect(weekDates).toHaveLength(7);
        expect(weekDates[0].day).toBe('Su');
        expect(weekDates[6].day).toBe('Sa');
    });

    test('should return correct dates for the current week', () => {
        const weekDates = getWeekDates();
        const today = new Date();
        const dayOfWeek = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);

        weekDates.forEach((day, index) => {
            const expectedDate = new Date(sunday);
            expectedDate.setDate(sunday.getDate() + index);
            expect(day.date).toBe(expectedDate.getDate());
            expect(day.fullDate.toDateString()).toBe(expectedDate.toDateString());
        });
    });

    test('should return correct dates when offset is applied', () => {
        const offset = 1;
        const weekDates = getWeekDates(offset);
        const today = new Date();
        today.setDate(today.getDate() + offset * 7);
        const dayOfWeek = today.getDay();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() - dayOfWeek);

        weekDates.forEach((day, index) => {
            const expectedDate = new Date(sunday);
            expectedDate.setDate(sunday.getDate() + index);
            expect(day.date).toBe(expectedDate.getDate());
            expect(day.fullDate.toDateString()).toBe(expectedDate.toDateString());
        });
    });
});
