import api from './api';

// Get all serve attempts
export const getServeAttempts = async () => {
  try {
    const response = await api.get('/serves');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching serve attempts';
  }
};

// Get serve attempts for a client
export const getClientServeAttempts = async (clientId) => {
  try {
    const response = await api.get(`/serves/client/${clientId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching client serve attempts';
  }
};

// Create a new serve attempt
export const createServeAttempt = async (serveData) => {
  try {
    const response = await api.post('/serves', serveData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating serve attempt';
  }
};

// Update a serve attempt
export const updateServeAttempt = async (id, serveData) => {
  try {
    const response = await api.put(`/serves/${id}`, serveData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating serve attempt';
  }
};

// Delete a serve attempt
export const deleteServeAttempt = async (id) => {
  try {
    const response = await api.delete(`/serves/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting serve attempt';
  }
};
