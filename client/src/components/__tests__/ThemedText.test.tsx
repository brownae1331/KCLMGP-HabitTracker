import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../ThemedText';
import { ThemeProvider } from '../ThemeContext'; // 

describe('ThemedText Component', () => {
  test('renders correctly with light theme', () => {
    const { getByText } = render(
      <ThemeProvider> 
        <ThemedText>Test Text</ThemedText>
      </ThemeProvider>
    );
    expect(getByText('Test Text')).toBeTruthy();
  });
});
