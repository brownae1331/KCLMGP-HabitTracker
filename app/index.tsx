import { Redirect } from 'expo-router';
import { init } from '@/lib/database';
import { useEffect } from 'react';

export default function IndexRoute() {
  useEffect(() => {
    init()
      .then(() => {
        console.log('Database initialized');
      })
      .catch((error) => {
        console.error('Error initializing database:', error);
      });
  }, []);

  return <Redirect href="/(auth)/login" />;
}
