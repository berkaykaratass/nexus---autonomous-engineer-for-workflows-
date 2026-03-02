
import { User, ApiResponse } from '../types';
import { dbQuery, dbExec } from './db';

// Simple Auth simulation
export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<User>> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    const users = dbQuery("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    
    if (users.length > 0) {
      const u = users[0];
      return {
        success: true,
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl
        }
      };
    }
    return { success: false, error: 'Invalid credentials.' };
  },

  signup: async (name: string, email: string, password: string): Promise<ApiResponse<User>> => {
    await new Promise(r => setTimeout(r, 600));

    // Check existing
    const existing = dbQuery("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return { success: false, error: 'Email already in use' };
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name,
      email,
      password,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };

    const success = dbExec("INSERT INTO users VALUES (?, ?, ?, ?, ?)", [
      newUser.id, newUser.name, newUser.email, newUser.password, newUser.avatarUrl
    ]);

    if (success) {
      return { success: true, data: { id: newUser.id, name: newUser.name, email: newUser.email, avatarUrl: newUser.avatarUrl } };
    }
    return { success: false, error: 'Failed to create account' };
  }
};
