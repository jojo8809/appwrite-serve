import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import api from '../services/api';

export interface UploadedDocument {
  id: string;
  clientId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  caseNumber?: string;
  description?: string;
  caseName?: string;
}

/**
 * Uploads a document for a client
 */
export async function uploadClientDocument(
  clientId,
  file,
  caseNumber,
  description
) {
  try {
    // Create form data to send to the server
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('fileType', file.type);
    formData.append('fileSize', file.size.toString());
    
    if (caseNumber) {
      formData.append('caseNumber', caseNumber);
    }
    
    if (description) {
      formData.append('description', description);
    }
    
    const response = await api.post(`/documents/upload/${clientId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error uploading document:", error);
    toast("Error uploading document", {
      description: "There was an error uploading your document. Please try again."
    });
    return null;
  }
}

/**
 * Gets all documents for a client
 */
export async function getClientDocuments(clientId, caseNumber) {
  try {
    let url = `/documents/${clientId}`;
    if (caseNumber) {
      url += `?caseNumber=${caseNumber}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    toast("Error fetching documents", {
      description: "There was an error fetching documents. Please try again."
    });
    return [];
  }
}

/**
 * Gets a signed URL for a document
 */
export async function getDocumentUrl(documentId) {
  try {
    const response = await api.get(`/documents/url/${documentId}`);
    return response.data.url;
  } catch (error) {
    console.error("Error getting document URL:", error);
    toast("Error accessing document", {
      description: "There was an error getting the document URL. Please try again."
    });
    return null;
  }
}

/**
 * Deletes a client document
 */
export async function deleteClientDocument(id, filePath) {
  try {
    await api.delete(`/documents/${id}`);
    
    toast("Document deleted", {
      description: "Document has been permanently removed."
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    toast("Error deleting document", {
      description: "There was an error deleting the document. Please try again."
    });
    return false;
  }
}

/**
 * Gets all cases for a client
 */
export async function getClientCases(clientId) {
  try {
    const response = await api.get(`/cases/${clientId}`);
    
    return response.data.map(caseItem => ({
      caseNumber: caseItem.case_number,
      caseName: caseItem.case_name
    }));
  } catch (error) {
    console.error("Error fetching client cases:", error);
    return [];
  }
}
