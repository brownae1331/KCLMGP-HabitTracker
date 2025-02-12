const BASE_URL = 'http://localhost:3000'; // Change this URL to your deployed server's URL if needed

// Define the Habit type
export type Habit = {
  username: string;
  name: string;
  description?: string;
  amount?: number;
  positive?: boolean;
  date?: string;
  increment?: string;
  location?: string;
  notifications?: boolean;
  notification_sound?: string;
  streak?: number;
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

// Fetch habits for a given username.
export async function getHabits(username: string): Promise<Habit[]> {
  const response = await fetch(`${BASE_URL}/habits/${username}`);
  if (!response.ok) {
    throw new Error('Error fetching habits');
  }
  return response.json();
}

// Get habits for a specific user (alias for getHabits)
export const getHabitsByUser = getHabits;

// Create a new user.
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

  return data;
}

// Sign in a user.
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

  return data;
}

// Add a habit.
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

// Delete a habit.
export async function deleteHabit(username: string, name: string) {
  const response = await fetch(`${BASE_URL}/habits/${username}/${name}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error deleting habit');
  }
  return response.json();
}

// Delete a specific user by username.
export async function deleteUser(username: string) {
  const response = await fetch(`${BASE_URL}/users/${username}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error deleting user');
  }
  return response.json();
}
