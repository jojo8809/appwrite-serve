import api from './api';

// Register a new user
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    if (response.data) {
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      localStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'An error occurred during registration';
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/users/login', { email, password });
    if (response.data) {
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      localStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Invalid email or password';
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('userToken');
};

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching user profile';
  }
};
