import { Redirect } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';

// Entry route redirects users based on authentication status (login or main app)
export default function IndexRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();

  // Show loading spinner while authentication status is being determined
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[theme].background }}>
        <ActivityIndicator testID='loading-indicator' size="large" color={Colors[theme].tint} />
      </View>
    );
  }

  // Redirect authenticated users to the protected habits screen
  if (isAuthenticated) {
    return <Redirect href="/(protected)/(tabs)/habits" />;
  }

  // Redirect unauthenticated users to login
  return <Redirect href="/(auth)/login" />;
}
