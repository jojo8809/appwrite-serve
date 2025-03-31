
import { Client, Account, Databases, Storage, ID, Query, Teams, Functions } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

// Initialize Appwrite services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const functions = new Functions(client);

// Database and collection IDs
const DATABASE_ID = 'serve-tracker-db';
const CLIENTS_COLLECTION_ID = 'clients';
const SERVE_ATTEMPTS_COLLECTION_ID = 'serve_attempts';
const CASES_COLLECTION_ID = 'client_cases';
const DOCUMENTS_COLLECTION_ID = 'client_documents';
const STORAGE_BUCKET_ID = 'client-documents';

// Helper functions for CRUD operations
export const appwrite = {
  client,
  account,
  databases,
  storage,
  teams,
  functions,
  
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
          notes: client.notes
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
          notes: clientData.notes
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
      
      // Convert Appwrite document format to the app's format
      return response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id,
        caseNumber: doc.case_number,
        status: doc.status,
        notes: doc.notes,
        coordinates: doc.coordinates,
        timestamp: doc.timestamp,
        imageData: doc.image_data,
        attemptNumber: doc.attempt_number
      }));
    } catch (error) {
      console.error('Error fetching serve attempts:', error);
      return [];
    }
  },
  
  async createServeAttempt(serveData) {
    try {
      const serveId = serveData.id || ID.unique();
      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        serveId,
        {
          client_id: serveData.clientId,
          case_number: serveData.caseNumber,
          status: serveData.status,
          notes: serveData.notes,
          coordinates: serveData.coordinates,
          timestamp: serveData.timestamp,
          image_data: serveData.imageData,
          attempt_number: serveData.attemptNumber
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
          client_id: serveData.clientId,
          case_number: serveData.caseNumber,
          status: serveData.status,
          notes: serveData.notes,
          coordinates: serveData.coordinates,
          timestamp: serveData.timestamp,
          image_data: serveData.imageData,
          attempt_number: serveData.attemptNumber
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
        fileId: response.$id,
        filePath: path || response.$id
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
  
  getFilePreview(fileId) {
    return storage.getFilePreview(STORAGE_BUCKET_ID, fileId);
  },
  
  async deleteFile(fileId) {
    try {
      await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
  
  // Real-time subscriptions
  setupRealtimeSubscription(callback) {
    // Appwrite real-time subscription for serve attempts collection
    const unsubscribe = client.subscribe(`databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`, response => {
      if (callback && typeof callback === 'function') {
        callback(response);
      }
    });
    
    // Return cleanup function
    return () => {
      unsubscribe();
    };
  },
  
  // Data sync functions
  async syncLocalServesToAppwrite(localServes) {
    try {
      // Get all serve attempts from Appwrite
      const appwriteServes = await this.getServeAttempts();
      const appwriteServeIds = new Set(appwriteServes.map(serve => serve.id));
      
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
      return false;
    }
  },
  
  async syncAppwriteServesToLocal() {
    try {
      // Get all serve attempts from Appwrite
      const appwriteServes = await this.getServeAttempts();
      
      if (appwriteServes && appwriteServes.length > 0) {
        console.log(`Synced ${appwriteServes.length} serve attempts from Appwrite to local storage`);
        return appwriteServes;
      }
      
      return [];
    } catch (error) {
      console.error('Error syncing Appwrite serves to local:', error);
      return null;
    }
  }
};

// Export singleton instance
export default appwrite;
