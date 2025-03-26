import { HabitModalStyles } from '../../styles/HabitModalStyles';

describe('HabitModalStyles', () => {
    it('defines all expected style keys for habit modal components', () => {
        expect(HabitModalStyles).toBeDefined();
        expect(HabitModalStyles).toHaveProperty('modalOverlay');
        expect(HabitModalStyles).toHaveProperty('modalContent');
        expect(HabitModalStyles).toHaveProperty('descriptionInput');
        expect(HabitModalStyles).toHaveProperty('sliderContainer');
        expect(HabitModalStyles).toHaveProperty('sliderOption');
        expect(HabitModalStyles).toHaveProperty('selectedOption');
        expect(HabitModalStyles).toHaveProperty('colorSwatch');
        expect(HabitModalStyles).toHaveProperty('selectedSwatch');
        expect(HabitModalStyles).toHaveProperty('goalToggleContainer');
        expect(HabitModalStyles).toHaveProperty('goalFieldsContainer');
        expect(HabitModalStyles).toHaveProperty('buttonContainer');
        expect(HabitModalStyles).toHaveProperty('weeklyContainer');
        expect(HabitModalStyles).toHaveProperty('intervalContainer');
        expect(HabitModalStyles).toHaveProperty('dayButton');
        expect(HabitModalStyles).toHaveProperty('selectedDayButton');
        expect(HabitModalStyles).toHaveProperty('dayButtonText');
        expect(HabitModalStyles).toHaveProperty('selectedDayButtonText');
        expect(HabitModalStyles).toHaveProperty('picker');
    });
});
