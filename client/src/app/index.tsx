import { Redirect } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';

export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background }}>
        <ActivityIndicator testID='loading-indicator' size="large" color={Colors[theme].tint} />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/habits" />;
  }

  return <Redirect href="/(auth)/login" />;
}
