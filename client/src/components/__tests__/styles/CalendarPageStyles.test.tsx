import { CalendarPageStyles } from '../../styles/CalendarPageStyles';

describe('CalendarPageStyles', () => {
  it('exports the expected style keys', () => {
    expect(CalendarPageStyles).toBeDefined();
    expect(CalendarPageStyles).toHaveProperty('titleContainer');
    expect(CalendarPageStyles).toHaveProperty('calendarContainer');
    expect(CalendarPageStyles).toHaveProperty('statsContainer');
    expect(CalendarPageStyles).toHaveProperty('habitsContainer');
    expect(CalendarPageStyles).toHaveProperty('separator');
    expect(CalendarPageStyles).toHaveProperty('progressContainer');
    expect(CalendarPageStyles).toHaveProperty('percentageTextContainer');
    expect(CalendarPageStyles).toHaveProperty('percentageText');
  });
});
