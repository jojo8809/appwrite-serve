import axios from 'axios';

const API_BASE_URL = '/.netlify/functions/api';

// Add global axios interceptor for better error handling
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API request failed:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

const api = {
  // Check server health
  checkHealth: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/healthcheck`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
  
  // Clients
  getClients: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      throw error;
    }
  },
  
  getClient: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch client with id ${id}:`, error);
      throw error;
    }
  },
  
  createClient: async (clientData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/clients`, clientData);
      return response.data;
    } catch (error) {
      console.error('Failed to create client:', error);
      throw error;
    }
  },
  
  updateClient: async (id, clientData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/clients/${id}`, clientData);
      return response.data;
    } catch (error) {
      console.error(`Failed to update client with id ${id}:`, error);
      throw error;
    }
  },
  
  deleteClient: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete client with id ${id}:`, error);
      throw error;
    }
  },
  
  // Serve Attempts
  getServeAttempts: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/serve-attempts`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch serve attempts:', error);
      throw error;
    }
  },
  
  getClientServeAttempts: async (clientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/serve-attempts/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch serve attempts for client with id ${clientId}:`, error);
      throw error;
    }
  },
  
  createServeAttempt: async (attemptData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/serve-attempts`, attemptData);
      return response.data;
    } catch (error) {
      console.error('Failed to create serve attempt:', error);
      throw error;
    }
  },
  
  // Cases
  getCases: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cases`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch cases:', error);
      throw error;
    }
  },
  
  getClientCases: async (clientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cases/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch cases for client with id ${clientId}:`, error);
      throw error;
    }
  },
  
  createCase: async (caseData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/cases`, caseData);
      return response.data;
    } catch (error) {
      console.error('Failed to create case:', error);
      throw error;
    }
  },
  
  // Documents
  getCaseDocuments: async (caseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/documents/case/${caseId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch documents for case with id ${caseId}:`, error);
      throw error;
    }
  },
  
  createDocument: async (documentData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/documents`, documentData);
      return response.data;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }
};

export default api;
