import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { NotFoundPageStyles } from '../components/styles/NotFoundPageStyles';

// Not Found screen, displayed when a user navigates to a non-existent route
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={NotFoundPageStyles.container}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        <Link href="/" style={NotFoundPageStyles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </View>
    </>
  );
}
