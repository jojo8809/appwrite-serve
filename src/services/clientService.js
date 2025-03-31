import api from './api';

// Get all clients
export const getClients = async () => {
  try {
    const response = await api.get('/clients');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching clients';
  }
};

// Get client by ID
export const getClientById = async (id) => {
  try {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching client';
  }
};

// Create a new client
export const createClient = async (clientData) => {
  try {
    const response = await api.post('/clients', clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error creating client';
  }
};

// Update a client
export const updateClient = async (id, clientData) => {
  try {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating client';
  }
};

// Delete a client
export const deleteClient = async (id) => {
  try {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting client';
  }
};
