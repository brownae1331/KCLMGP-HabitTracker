import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'https://kclmgp-habittracker.onrender.com';
const BASE_URL = 'http://localhost:3000';

// Define the Habit type
export type Habit = {
  email: string;
  habitName: string;
  habitDescription: string;
  habitType: 'build' | 'quit';
  habitColor: string;
  scheduleOption: 'interval' | 'weekly';
  intervalDays: number | null;
  selectedDays: string[];
  goalValue: number | null;
  goalUnit: string | null;
};

// Define the User type
export type User = {
  username: string;
  email: string;
};

// Initialize the client, ensuring the server is reachable
export async function init() {
  try {
    const response = await fetch(`${BASE_URL}/init`);
    if (!response.ok) {
      throw new Error('Server initialization failed');
    }
    const data = await response.json();
    console.log('Client successfully connected to server:', data);
    return data;
  } catch (error) {
    console.error('Error initializing client:', error);
    throw error;
  }
}

// Fetch user details (email & username)
export async function getUserDetails(username: string) {
  const response = await fetch(`${BASE_URL}/users/${username}`);

  if (!response.ok) {
    throw new Error('Error fetching user details');
  }

  const data = await response.json();

  return data;
}

// Create a new user
export async function createUser(email: string, password: string, username: string) {
  const response = await fetch(`${BASE_URL}/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error creating user');
  }

  await AsyncStorage.setItem('username', data.username);
  await AsyncStorage.setItem('email', data.email);

  return data;
}

// Sign in a user & store user details in AsyncStorage
export async function logIn(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error logging in');
  }

  await AsyncStorage.setItem('username', data.username);
  await AsyncStorage.setItem('email', data.email);

  return data;
}

// Retrieve user details from AsyncStorage
export async function getStoredUser(): Promise<User | null> {
  try {
    const username = await AsyncStorage.getItem('username');
    const email = await AsyncStorage.getItem('email');

    if (username && email) {
      return { username, email };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error retrieving stored user data:', error);
    return null;
  }
}

// Logout user & clear stored data
export async function logout() {
  try {
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('email');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

//Fetch habits for a given username.
// export async function getHabits(username: string): Promise<Habit[]> {
//   const response = await fetch(`${BASE_URL}/habits/${username}`);
//   if (!response.ok) {
//     throw new Error('Error fetching habits');
//   }
//   return response.json();
// }

// Fetch habits for a particular user on a particular date
export async function getHabitsForDate(email: string, date: string): Promise<Habit[]> {
  const response = await fetch(`${BASE_URL}/habits/${email}/${date}`);
  if (!response.ok) {
    throw new Error('Error fetching habits');
  }

  const habits: Habit[] = await response.json();
  return habits;
}

// Add a habit
export async function addHabit(habitData: Habit) {
  const response = await fetch(`${BASE_URL}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habitData),
  });
  if (!response.ok) {
    throw new Error('Error adding habit');
  }
  return response.json();
}

// Delete a habit
export async function deleteHabit(username: string, name: string) {
  const response = await fetch(`${BASE_URL}/habits/${username}/${name}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error deleting habit');
  }
  return response.json();
}

// Delete a specific user by username
export async function deleteUser(username: string) {
  const response = await fetch(`${BASE_URL}/users/${username}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error deleting user');
  }
  return response.json();
}

// Update a habit's progress
export async function updateHabitProgress(email: string, habitName: string, progress: number) {
  const response = await fetch(`${BASE_URL}/habit-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, habitName, progress }),
  });
  if (!response.ok) {
    throw new Error('Error updating habit progress');
  }
  return response.json();
}

// Get habit progress data for all habits of a specific user on a specific date
export async function getHabitProgressByDate(email: string, date: string) {
  const encodedEmail = encodeURIComponent(email);

  // Ensure date is in MySQL-compatible format (YYYY-MM-DD)
  const formattedDate = new Date(date).toISOString().split('T')[0];

  const response = await fetch(`${BASE_URL}/habit-progress-by-date/${encodedEmail}/${formattedDate}`);
  if (!response.ok) {
    throw new Error('Error fetching habit progress');
  }
  return response.json();
}

// Change password
export async function updatePassword(username: string, oldPassword: string, newPassword: string) {
  try {
    const response = await fetch(`${BASE_URL}/users/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, oldPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update password');
    }

    return data;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

// Get interval days for a habit
export async function getHabitInterval(email: string, habitName: string) {
  const response = await fetch(`${BASE_URL}/habit-interval/${email}/${habitName}`);
  if (!response.ok) {
    throw new Error('Error fetching habit interval');
  }
  return response.json();
}

// Get habit days for a habit
export async function getHabitDays(email: string, habitName: string) {
  const response = await fetch(`${BASE_URL}/habit-days/${email}/${habitName}`);
  if (!response.ok) {
    throw new Error('Error fetching habit days');
  }
  return response.json();
}

// Update an existing habit
export async function updateHabit(habitData: Habit) {
  const response = await fetch(`${BASE_URL}/habits`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(habitData),
  });
  if (!response.ok) {
    throw new Error('Error updating habit');
  }
  return response.json();
}
