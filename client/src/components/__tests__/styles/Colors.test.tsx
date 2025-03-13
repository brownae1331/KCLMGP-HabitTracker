import { Colors } from '../../styles/Colors';

describe('Colors module', () => {
  test('dark mode has correct text color', () => {
    expect(Colors.dark.text).toBe('#ECEDEE'); // 或你期望的颜色值
  });
  test('light mode has correct text color', () => {
    expect(Colors.light.text).toBe('#11181C'); // 或你期望的颜色值
  });
});
