import { Client, Account, Databases, Storage, ID, Query, Teams, Functions } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/backendConfig';

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId);

// Initialize Appwrite services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const functions = new Functions(client);

// Database and collection IDs from config
const DATABASE_ID = APPWRITE_CONFIG.databaseId;
const CLIENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clients;
const SERVE_ATTEMPTS_COLLECTION_ID = APPWRITE_CONFIG.collections.serveAttempts;
const CASES_COLLECTION_ID = APPWRITE_CONFIG.collections.clientCases;
const DOCUMENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clientDocuments;
const STORAGE_BUCKET_ID = APPWRITE_CONFIG.storageBucket;

// Helper functions for CRUD operations
export const appwrite = {
  client,
  account,
  databases,
  storage,
  teams,
  functions,
  DATABASE_ID,
  CLIENTS_COLLECTION_ID,
  SERVE_ATTEMPTS_COLLECTION_ID,
  CASES_COLLECTION_ID,
  DOCUMENTS_COLLECTION_ID,
  STORAGE_BUCKET_ID,

  // Utility to check if Appwrite is properly configured
  isAppwriteConfigured() {
    return !!APPWRITE_CONFIG.projectId && !!APPWRITE_CONFIG.endpoint;
  },

  // Client operations
  async getClients() {
    try {
      const response = await databases.listDocuments(DATABASE_ID, CLIENTS_COLLECTION_ID);
      return response.documents;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  async createClient(client) {
    try {
      const clientId = client.id || ID.unique();
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: client.name,
          email: client.email,
          additional_emails: client.additionalEmails || [],
          phone: client.phone,
          address: client.address,
          notes: client.notes || "",
          created_at: now,
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  async updateClient(clientId, clientData) {
    try {
      const now = new Date().toISOString();
      console.log('Updating client with data:', clientData);
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: clientData.name || '',
          email: clientData.email || '',
          additional_emails: clientData.additionalEmails || [],
          phone: clientData.phone || '',
          address: clientData.address || '',
          notes: clientData.notes || '',
          updated_at: now
        }
      );
      console.log('Client update response:', response);
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      console.error('Error details:', error.response);
      throw error;
    }
  },

  async deleteClient(clientId) {
    try {
      console.log('Attempting to delete client:', clientId);
      
      // First delete all associated cases
      const cases = await this.getClientCases(clientId);
      console.log(`Found ${cases.length} cases to delete`);
      
      for (const caseDoc of cases) {
        try {
          await this.deleteClientCase(caseDoc.$id);
          console.log(`Deleted case: ${caseDoc.$id}`);
        } catch (caseError) {
          console.error(`Error deleting case ${caseDoc.$id}:`, caseError);
        }
      }
      
      // Delete all serve attempts
      const serves = await this.getClientServeAttempts(clientId);
      console.log(`Found ${serves.length} serve attempts to delete`);
      
      for (const serve of serves) {
        try {
          await this.deleteServeAttempt(serve.$id);
          console.log(`Deleted serve attempt: ${serve.$id}`);
        } catch (serveError) {
          console.error(`Error deleting serve attempt ${serve.$id}:`, serveError);
        }
      }
      
      // Delete all documents
      const documents = await this.getClientDocuments(clientId);
      console.log(`Found ${documents.length} documents to delete`);
      
      for (const doc of documents) {
        try {
          await this.deleteClientDocument(doc.$id, doc.file_path || doc.filePath);
          console.log(`Deleted document: ${doc.$id}`);
        } catch (docError) {
          console.error(`Error deleting document ${doc.$id}:`, docError);
        }
      }
      
      // Finally delete the client
      console.log('Deleting client record:', clientId);
      await databases.deleteDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId
      );
      
      console.log('Client and all associated data deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in client deletion process:', error);
      console.error('Error details:', error.response || error.message);
      throw error;
    }
  },

  // Serve attempts operations
  async getServeAttempts() {
    try {
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID);
      return response.documents;
    } catch (error) {
      console.error('Error fetching serve attempts:', error);
      return [];
    }
  },

  async getClientServeAttempts(clientId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error(`Error fetching serve attempts for client ${clientId}:`, error);
      return [];
    }
  },

  async createServeAttempt(serveData) {
    try {
      const serveId = serveData.id || ID.unique();
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId,
        {
          clientId: serveData.clientId,
          date: serveData.date,
          time: serveData.time,
          address: serveData.address,
          notes: serveData.notes,
          status: serveData.status || 'attempted',
          imageData: serveData.imageData || null,
          coordinates: serveData.coordinates || null,
          created_at: now,
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating serve attempt:', error);
      throw error;
    }
  },

  async updateServeAttempt(serveId, serveData) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId,
        {
          clientId: serveData.clientId,
          caseNumber: serveData.caseNumber || "",
          date: serveData.date,
          time: serveData.time,
          address: serveData.address,
          notes: serveData.notes,
          status: serveData.status,
          imageData: serveData.imageData || null,
          coordinates: serveData.coordinates || null,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating serve attempt:', error);
      throw error;
    }
  },

  async deleteServeAttempt(serveId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId
      );
      return true;
    } catch (error) {
      console.error('Error deleting serve attempt:', error);
      throw error;
    }
  },

  // Case operations
  async getClientCases(clientId) {
    try {
      console.log('Fetching cases for client:', clientId);
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      console.log('Case fetch response:', response);
      return response.documents;
    } catch (error) {
      console.error(`Error fetching cases for client ${clientId}:`, error);
      console.error('Error details:', error.response || error.message);
      return [];
    }
  },

  async createClientCase(caseData) {
    try {
      console.log('Creating case with data:', caseData);
      const caseId = ID.unique();
      const now = new Date().toISOString();
      
      const response = await databases.createDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          client_id: caseData.clientId,
          case_number: caseData.caseNumber,
          case_name: caseData.caseName,
          description: caseData.description || "",
          status: caseData.status || "Pending",
          home_address: caseData.homeAddress || "",
          work_address: caseData.workAddress || "",
          created_at: now,
          updated_at: now
        }
      );
      console.log('Case creation response:', response);
      return response;
    } catch (error) {
      console.error('Error creating case:', error);
      console.error('Error details:', error.response);
      throw error;
    }
  },

  async updateClientCase(caseId, caseData) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          caseNumber: caseData.caseNumber,
          caseName: caseData.caseName || "",
          courtName: caseData.courtName || "",
          description: caseData.description || "",
          homeAddress: caseData.homeAddress || "",
          workAddress: caseData.workAddress || "",
          status: caseData.status,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating client case:', error);
      throw error;
    }
  },

  async deleteClientCase(caseId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId
      );
      return true;
    } catch (error) {
      console.error('Error deleting client case:', error);
      throw error;
    }
  },

  async updateCaseStatus(caseId, status) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          status: status,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  },

  // Storage operations
  async uploadFile(file, path) {
    try {
      const fileId = ID.unique();
      const response = await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file
      );
      
      console.log("File uploaded successfully:", response);
      
      return {
        id: fileId,
        path: path || fileId,
        size: file.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async getFilePreview(fileId) {
    try {
      const previewUrl = storage.getFilePreview(
        STORAGE_BUCKET_ID,
        fileId
      );
      return previewUrl;
    } catch (error) {
      console.error('Error getting file preview:', error);
      throw error;
    }
  },

  async getFileView(fileId) {
    try {
      const viewUrl = storage.getFileView(
        STORAGE_BUCKET_ID,
        fileId
      );
      return viewUrl;
    } catch (error) {
      console.error('Error getting file view:', error);
      throw error;
    }
  },

  async deleteFile(fileId) {
    try {
      await storage.deleteFile(
        STORAGE_BUCKET_ID,
        fileId
      );
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },

  // Document operations
  async getClientDocuments(clientId, caseNumber) {
    try {
      let queries = [Query.equal('client_id', clientId)];
      
      if (caseNumber) {
        queries.push(Query.equal('case_number', caseNumber));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        queries
      );
      
      return response.documents;
    } catch (error) {
      console.error(`Error fetching documents for client ${clientId}:`, error);
      throw error;
    }
  },

  async uploadClientDocument(clientId, file, caseNumber, description) {
    try {
      // First upload the file to storage
      const fileId = ID.unique();
      const fileUploadResponse = await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file
      );
      
      console.log("File uploaded to storage:", fileUploadResponse);
      
      // Then create a document record
      const docId = ID.unique();
      const now = new Date().toISOString();
      
      const document = await databases.createDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        docId,
        {
          client_id: clientId,
          case_number: caseNumber || "",
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: fileId,
          description: description || "",
          created_at: now
        }
      );
      
      console.log("Document record created:", document);
      return document;
    } catch (error) {
      console.error('Error uploading client document:', error);
      throw error;
    }
  },

  async getDocumentUrl(fileId) {
    try {
      const fileUrl = storage.getFileView(
        STORAGE_BUCKET_ID,
        fileId
      );
      return fileUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      throw error;
    }
  },

  async deleteClientDocument(docId, fileId) {
    try {
      // First delete the document record
      await databases.deleteDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        docId
      );
      
      // Then delete the actual file
      if (fileId) {
        await storage.deleteFile(
          STORAGE_BUCKET_ID,
          fileId
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting client document:', error);
      throw error;
    }
  },

  // Real-time subscriptions
  setupRealtimeSubscription(callback) {
    try {
      console.log("Setting up real-time subscription for collections");
      
      const unsubscribe = client.subscribe([
        `databases.${DATABASE_ID}.collections.${CLIENTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${CASES_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${DOCUMENTS_COLLECTION_ID}.documents`,
      ], response => {
        console.log("Received real-time update:", response);
        callback(response);
      });
      
      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up real-time subscription:", error);
      return () => {}; // Return empty function if subscription fails
    }
  }
};
