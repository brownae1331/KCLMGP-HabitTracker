import AsyncStorage from '@react-native-async-storage/async-storage';

// const BASE_URL = 'https://kclmgp-habittracker.onrender.com';
export const BASE_URL = 'http://localhost:3000';

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
export async function deleteHabit(email: string, habitName: string) {
  const response = await fetch(
    `${BASE_URL}/habits/${email}/${encodeURIComponent(habitName)}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error('Error deleting habit');
  }
  return response.json();
}

// Delete a specific user by email (primary key)
export async function deleteUser(email: string) {
  const response = await fetch(
    `${BASE_URL}/users/${email}`,
    {
      method: 'DELETE',
    }
  );
  if (!response.ok) {
    throw new Error('Error deleting user');
  }
  return response.json();
}

// Update a habit's progress
export async function updateHabitProgress(email: string, habitName: string, progress: number) {
  const response = await fetch(`${BASE_URL}/progress`, {
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

  const response = await fetch(`${BASE_URL}/progress/${encodedEmail}/${formattedDate}`);
  if (!response.ok) {
    throw new Error('Error fetching habit progress');
  }
  return response.json();
}

// Get habit progress for a specific habit on a specific date
export async function getHabitProgressByDateAndHabit(email: string, habitName: string, date: string) {
  const encodedEmail = encodeURIComponent(email);
  const formattedDate = new Date(date).toISOString().split('T')[0];
  const response = await fetch(`${BASE_URL}/progress/${encodedEmail}/${habitName}/${formattedDate}`);
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
  const response = await fetch(`${BASE_URL}/habits/interval/${email}/${habitName}`);
  if (!response.ok) {
    throw new Error('Error fetching habit interval');
  }
  return response.json();
}

// Get habit days for a habit
export async function getHabitDays(email: string, habitName: string) {
  const response = await fetch(`${BASE_URL}/habits/days/${email}/${habitName}`);
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

// Get habit streak
export async function getHabitStreak(email: string, habitName: string, date: string) {
  const response = await fetch(`${BASE_URL}/progress/streak/${email}/${habitName}/${date}`);
  if (!response.ok) {
    throw new Error('Error fetching habit streak');
  }
  return response.json();
}

// generic function to handle api requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch from ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

// fetch a user's habits
export const fetchHabits = async (email: string): Promise<any[]> => {
  const data = await apiRequest<any[]>(`${BASE_URL}/habits/${email}`);
  if (!Array.isArray(data)) {
    console.error('Invalid habits response format:', data);
    return [];
  }
  return data;
};

// fetch progress data for a build habit
export async function fetchBuildHabitProgress(email: string, habitName: string, range: 'week' | 'month' | 'year') {
  return apiRequest<any[]>(`${BASE_URL}/progress/stats/progress/${email}/${habitName}?range=${range}`);
}

// fetch streak data
export async function fetchStreak(email: string, habitName: string, range: 'week' | 'month') {
  return apiRequest<any[]>(`${BASE_URL}/progress/stats/streak/${email}/${habitName}?range=${range}`);
}

// fetch longest streak
export async function fetchLongestStreak(email: string, habitName: string): Promise<number> {
  const data = await apiRequest<{ longestStreak: number }>(`${BASE_URL}/progress/stats/longest-streak/${email}/${habitName}`);
  return data.longestStreak;
}

// fetch completion rate
export async function fetchCompletionRate(email: string, habitName: string): Promise<number> {
  const data = await apiRequest<{ completionRate: number }>(`${BASE_URL}/progress/stats/completion-rate/${email}/${habitName}`);
  return data.completionRate;
}

// fetch average progress
export async function fetchAverageProgress(email: string, habitName: string): Promise<number> {
  const data = await apiRequest<{ averageProgress: number }>(`${BASE_URL}/progress/stats/average-progress/${email}/${habitName}`);
  return data.averageProgress;
}

// export user data
export async function exportUserData(email: string) {
  return apiRequest<any>(`${BASE_URL}/users/export/${email}`);
}