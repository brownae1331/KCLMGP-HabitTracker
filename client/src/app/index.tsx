import { Redirect } from 'expo-router';
import { useAuth } from '../components/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../components/ThemeContext';
import { Colors } from '../components/styles/Colors';

/**
 * Index route component.
 * Automatically redirects users to login or the protected habits screen based on auth status.
 */
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
