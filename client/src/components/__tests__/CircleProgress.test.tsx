import React from 'react';
import { render } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';
import { CircleProgress } from '../CircleProgress';

// Mock the useTheme hook
jest.mock('../ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

describe('CircleProgress Component', () => {
  it('renders and calculates strokeDashoffset correctly', () => {
    const { UNSAFE_getAllByType } = render(
      <CircleProgress percentage={75} color="blue" size={120} />
    );

    const circles = UNSAFE_getAllByType(Circle);
    expect(circles.length).toBe(2);

    const radius = (120 - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const expectedOffset = circumference - (75 / 100) * circumference;

    expect(circles[1].props.strokeDashoffset).toBeCloseTo(expectedOffset, 2);
  });
});
