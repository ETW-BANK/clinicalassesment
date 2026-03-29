// services/authService.js
import api from './api';

const authService = {
  // Register new user
  async register(emailOrCredentials, password) {
    try {
      const email =
        typeof emailOrCredentials === 'object'
          ? emailOrCredentials?.email
          : emailOrCredentials;
      const pass =
        typeof emailOrCredentials === 'object'
          ? emailOrCredentials?.password
          : password;

      const response = await api.post('/Auth/register', { email, password: pass });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  async login(emailOrCredentials, password) {
    try {
      const email =
        typeof emailOrCredentials === 'object'
          ? emailOrCredentials?.email
          : emailOrCredentials;
      const pass =
        typeof emailOrCredentials === 'object'
          ? emailOrCredentials?.password
          : password;

      const response = await api.post('/Auth/login', { email, password: pass });
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  async logout() {
    try {
      await api.post('/Auth/logout');
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Get all users (admin only)
  async getUsers() {
    const response = await api.get('/Auth/users');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Get current user
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export default authService;