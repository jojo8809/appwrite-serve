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
  
  // Utility to check if Appwrite is properly configured
  isAppwriteConfigured() {
    return !!APPWRITE_CONFIG.projectId && !!APPWRITE_CONFIG.endpoint;
  },
  
  // Client operations
  async getClients() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
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
          notes: client.notes,
          created_at: now
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },
  
  async updateClient(clientId, clientData) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: clientData.name,
          email: clientData.email,
          additional_emails: clientData.additionalEmails || [],
          phone: clientData.phone,
          address: clientData.address,
          notes: clientData.notes,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },
  
  async deleteClient(clientId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId
      );
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
  
  // Serve attempts operations
  async getServeAttempts() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID
      );
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
        [Query.equal('clientId', clientId)]
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
          created_at: now
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
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('clientId', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error(`Error fetching cases for client ${clientId}:`, error);
      return [];
    }
  },
  
  async createClientCase(caseData) {
    try {
      const caseId = caseData.id || ID.unique();
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          clientId: caseData.clientId,
          caseNumber: caseData.caseNumber,
          courtName: caseData.courtName,
          caseName: caseData.caseName,
          status: caseData.status || 'active',
          created_at: now
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating client case:', error);
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
          courtName: caseData.courtName,
          caseName: caseData.caseName,
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
      let queries = [Query.equal('clientId', clientId)];
      
      if (caseNumber) {
        queries.push(Query.equal('caseNumber', caseNumber));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        queries
      );
      
      return response.documents;
    } catch (error) {
      console.error(`Error fetching documents for client ${clientId}:`, error);
      return [];
    }
  },
  
  async uploadClientDocument(clientId, file, caseNumber, description) {
    try {
      // First upload the file to storage
      const fileId = ID.unique();
      await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file
      );
      
      // Then create a document record
      const docId = ID.unique();
      const now = new Date().toISOString();
      
      const document = await databases.createDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        docId,
        {
          clientId: clientId,
          caseNumber: caseNumber || '',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          filePath: fileId,
          description: description || '',
          uploadedAt: now
        }
      );
      
      return {
        id: docId,
        fileId: fileId,
        ...document
      };
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
    const unsubscribe = client.subscribe([
      `databases.${DATABASE_ID}.collections.${CLIENTS_COLLECTION_ID}.documents`,
      `databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`,
      `databases.${DATABASE_ID}.collections.${CASES_COLLECTION_ID}.documents`,
      `databases.${DATABASE_ID}.collections.${DOCUMENTS_COLLECTION_ID}.documents`,
    ], response => {
      callback(response);
    });
    
    return () => {
      unsubscribe();
    };
  },
  
  // Email functions
  async sendEmail(emailData) {
    try {
      if (!this.isAppwriteConfigured()) {
        throw new Error("Appwrite is not properly configured");
      }
      
      const { to, subject, body, imageData, coordinates } = emailData;
      
      const execution = await functions.createExecution(
        APPWRITE_CONFIG.functionIds.sendEmail,
        JSON.stringify({
          to,
          subject,
          body,
          imageData,
          coordinates
        }),
        false
      );
      
      if (execution.status === 'completed' && execution.statusCode === 200) {
        return {
          success: true,
          message: "Email sent successfully"
        };
      } else {
        console.error("Email function execution failed:", execution);
        return {
          success: false,
          message: `Failed to send email: ${execution.stderr || 'Unknown error'}`
        };
      }
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error sending email"
      };
    }
  },
  
  // Sync/migration functions
  async syncLocalServesToAppwrite(localServes) {
    try {
      // Get all serve attempts from Appwrite
      const appwriteServes = await this.getServeAttempts();
      const appwriteServeIds = new Set(appwriteServes.map(serve => serve.$id));
      
      // Find serves that need to be created in Appwrite
      const servesToCreate = localServes.filter(serve => !appwriteServeIds.has(serve.id));
      
      // Create new serves in Appwrite
      for (const serve of servesToCreate) {
        await this.createServeAttempt(serve);
      }
      
      console.log(`Synced ${servesToCreate.length} local serves to Appwrite`);
      return true;
    } catch (error) {
      console.error('Error syncing local serves to Appwrite:', error);
      throw error;
    }
  },
  
  async syncAppwriteServesToLocal() {
    try {
      // Get all serve attempts from Appwrite
      const appwriteServes = await this.getServeAttempts();
      
      if (appwriteServes && appwriteServes.length > 0) {
        console.log(`Synced ${appwriteServes.length} serve attempts from Appwrite to local storage`);
        return appwriteServes.map(serve => ({
          id: serve.$id,
          clientId: serve.clientId,
          date: serve.date,
          time: serve.time,
          address: serve.address,
          notes: serve.notes,
          status: serve.status,
          imageData: serve.imageData,
          coordinates: serve.coordinates
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error syncing Appwrite serves to local:', error);
      throw error;
    }
  }
};
