import React from 'react';
import { render } from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import StatsBoxes from '../StatsBoxes';

jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('StatsBoxes Component', () => {
  const props = {
    currentStreak: 5,
    longestStreak: 10,
    completionRate: 80,
    fourthStat: {
      label: 'Test Stat',
      value: 'Test Value',
    },
  };

  it('renders correctly with provided stats', () => {
    const { getByText } = render(<StatsBoxes {...props} />);
    
    expect(getByText('5')).toBeTruthy();
    expect(getByText('Current Streak')).toBeTruthy();

    expect(getByText('10')).toBeTruthy();
    expect(getByText('Longest Streak')).toBeTruthy();

    expect(getByText('80%')).toBeTruthy();
    expect(getByText('completion Rate')).toBeTruthy();

    expect(getByText('Test Value')).toBeTruthy();
    expect(getByText('Test Stat')).toBeTruthy();
  });

  it('matches snapshot', () => {
    const tree = renderer.create(<StatsBoxes {...props} />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
