import api from './api';

// Upload a client document
export const uploadDocument = async (clientId, formData) => {
  try {
    const response = await api.post(`/documents/upload/${clientId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error uploading document';
  }
};

// Get client documents
export const getClientDocuments = async (clientId, caseNumber = null) => {
  try {
    let url = `/documents/${clientId}`;
    if (caseNumber) {
      url += `?caseNumber=${caseNumber}`;
    }
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching documents';
  }
};

// Get document download URL
export const getDocumentUrl = async (documentId) => {
  try {
    const response = await api.get(`/documents/url/${documentId}`);
    return response.data.url;
  } catch (error) {
    throw error.response?.data?.message || 'Error getting document URL';
  }
};

// Delete client document
export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting document';
  }
};
