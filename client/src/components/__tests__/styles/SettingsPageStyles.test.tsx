import { SettingsPageStyles } from '../../styles/SettingsPageStyles';

describe('SettingsPageStyles', () => {
    it('exports the expected style keys for Settings page', () => {
        expect(SettingsPageStyles).toBeDefined();
        expect(SettingsPageStyles).toHaveProperty('titleContainer');
        expect(SettingsPageStyles).toHaveProperty('settingItem');
        expect(SettingsPageStyles).toHaveProperty('signOutButton');
        expect(SettingsPageStyles).toHaveProperty('signOutText');
    });
});
