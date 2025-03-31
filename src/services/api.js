import axios from 'axios';

const API_BASE_URL = '/.netlify/functions/api';

const api = {
  // Clients
  getClients: async () => {
    const response = await axios.get(`${API_BASE_URL}/clients`);
    return response.data;
  },
  
  getClient: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/clients/${id}`);
    return response.data;
  },
  
  createClient: async (clientData) => {
    const response = await axios.post(`${API_BASE_URL}/clients`, clientData);
    return response.data;
  },
  
  updateClient: async (id, clientData) => {
    const response = await axios.put(`${API_BASE_URL}/clients/${id}`, clientData);
    return response.data;
  },
  
  deleteClient: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/clients/${id}`);
    return response.data;
  },
  
  // Serve Attempts
  getServeAttempts: async () => {
    const response = await axios.get(`${API_BASE_URL}/serve-attempts`);
    return response.data;
  },
  
  getClientServeAttempts: async (clientId) => {
    const response = await axios.get(`${API_BASE_URL}/serve-attempts/client/${clientId}`);
    return response.data;
  },
  
  createServeAttempt: async (attemptData) => {
    const response = await axios.post(`${API_BASE_URL}/serve-attempts`, attemptData);
    return response.data;
  },
  
  // Cases
  getCases: async () => {
    const response = await axios.get(`${API_BASE_URL}/cases`);
    return response.data;
  },
  
  getClientCases: async (clientId) => {
    const response = await axios.get(`${API_BASE_URL}/cases/client/${clientId}`);
    return response.data;
  },
  
  createCase: async (caseData) => {
    const response = await axios.post(`${API_BASE_URL}/cases`, caseData);
    return response.data;
  },
  
  // Documents
  getCaseDocuments: async (caseId) => {
    const response = await axios.get(`${API_BASE_URL}/documents/case/${caseId}`);
    return response.data;
  },
  
  createDocument: async (documentData) => {
    const response = await axios.post(`${API_BASE_URL}/documents`, documentData);
    return response.data;
  }
};

export default api;
