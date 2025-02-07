import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GoodHabitGraph from '../../components/GoodHabitGraph';

export default function StatsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Stats</ThemedText>
        </ThemedView>
        <GoodHabitGraph />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // headerImage: {
  //   color: '#808080',
  //   bottom: -90,
  //   left: -35,
  //   position: 'absolute',
  // },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});