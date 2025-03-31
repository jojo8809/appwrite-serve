
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
      const now = serveData.timestamp || new Date().toISOString();
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
          timestamp: now,
          image_data: serveData.imageData,
          attempt_number: serveData.attemptNumber || 1
        }
      );
      return {
        id: response.$id,
        clientId: response.client_id,
        caseNumber: response.case_number,
        status: response.status,
        notes: response.notes,
        coordinates: response.coordinates,
        timestamp: response.timestamp,
        imageData: response.image_data,
        attemptNumber: response.attempt_number
      };
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
      return {
        id: response.$id,
        clientId: response.client_id,
        caseNumber: response.case_number,
        status: response.status,
        notes: response.notes,
        coordinates: response.coordinates,
        timestamp: response.timestamp,
        imageData: response.image_data,
        attemptNumber: response.attempt_number
      };
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
      return { success: true };
    } catch (error) {
      console.error('Error deleting serve attempt:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Case operations
  async getClientCases(clientId) {
    try {
      const query = [Query.equal('client_id', clientId)];
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        query
      );
      
      return response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id,
        caseName: doc.case_name,
        caseNumber: doc.case_number,
        description: doc.description,
        status: doc.status,
        homeAddress: doc.home_address,
        workAddress: doc.work_address,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));
    } catch (error) {
      console.error('Error fetching client cases:', error);
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
          client_id: caseData.clientId,
          case_name: caseData.caseName,
          case_number: caseData.caseNumber,
          description: caseData.description || '',
          status: caseData.status || 'Pending',
          home_address: caseData.homeAddress || '',
          work_address: caseData.workAddress || '',
          created_at: now,
          updated_at: now
        }
      );
      
      return {
        id: response.$id,
        clientId: response.client_id,
        caseName: response.case_name,
        caseNumber: response.case_number,
        description: response.description,
        status: response.status,
        homeAddress: response.home_address,
        workAddress: response.work_address,
        createdAt: response.created_at,
        updatedAt: response.updated_at
      };
    } catch (error) {
      console.error('Error creating client case:', error);
      throw error;
    }
  },

  async updateCaseStatus(clientId, caseNumber, status) {
    try {
      // First, find the case by client_id and case_number
      const query = [
        Query.equal('client_id', clientId),
        Query.equal('case_number', caseNumber)
      ];
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        query
      );
      
      if (response.documents.length === 0) {
        console.error('Case not found for status update');
        return false;
      }
      
      // Get the case document
      const caseDoc = response.documents[0];
      const caseId = caseDoc.$id;
      
      // Update the status
      await databases.updateDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          status: status,
          updated_at: new Date().toISOString()
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error updating case status:', error);
      return false;
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
  
  async getFileView(fileId) {
    try {
      return storage.getFileView(STORAGE_BUCKET_ID, fileId);
    } catch (error) {
      console.error('Error getting file view URL:', error);
      return null;
    }
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
  
  // Document operations
  async getClientDocuments(clientId, caseNumber) {
    try {
      let query = [Query.equal('client_id', clientId)];
      
      if (caseNumber) {
        query.push(Query.equal('case_number', caseNumber));
      }
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        query
      );
      
      return response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileType: doc.file_type,
        fileSize: doc.file_size,
        caseNumber: doc.case_number,
        description: doc.description,
        createdAt: doc.created_at
      }));
    } catch (error) {
      console.error('Error fetching client documents:', error);
      return [];
    }
  },
  
  async uploadClientDocument(clientId, file, caseNumber, description) {
    try {
      // Upload the file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${ID.unique()}.${fileExt}`;
      const filePath = `${clientId}/${fileName}`;
      
      const storageFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        filePath,
        file
      );
      
      // Get case name if available
      let caseName = undefined;
      if (caseNumber) {
        const caseQuery = [
          Query.equal('client_id', clientId),
          Query.equal('case_number', caseNumber)
        ];
        
        const caseResponse = await databases.listDocuments(
          DATABASE_ID,
          CASES_COLLECTION_ID,
          caseQuery
        );
        
        if (caseResponse.documents.length > 0) {
          caseName = caseResponse.documents[0].case_name;
        }
      }
      
      // Create document record
      const docId = ID.unique();
      const documentData = {
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        case_number: caseNumber,
        description: description,
        created_at: new Date().toISOString()
      };
      
      const docResponse = await databases.createDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        docId,
        documentData
      );
      
      return {
        id: docResponse.$id,
        clientId: docResponse.client_id,
        fileName: docResponse.file_name,
        filePath: docResponse.file_path,
        fileType: docResponse.file_type,
        fileSize: docResponse.file_size,
        caseNumber: docResponse.case_number,
        description: docResponse.description,
        caseName: caseName
      };
    } catch (error) {
      console.error('Error uploading client document:', error);
      return null;
    }
  },
  
  async getDocumentUrl(filePath) {
    try {
      const fileId = filePath.split('/').pop();
      const result = await storage.getFileView(STORAGE_BUCKET_ID, filePath);
      return result.href;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  },
  
  async deleteClientDocument(id, filePath) {
    try {
      // Delete file from storage
      if (filePath) {
        await storage.deleteFile(STORAGE_BUCKET_ID, filePath);
      }
      
      // Delete document record
      await databases.deleteDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        id
      );
      
      return true;
    } catch (error) {
      console.error('Error deleting client document:', error);
      return false;
    }
  },
  
  // Real-time subscriptions
  setupRealtimeSubscription(callback) {
    try {
      console.log("Setting up real-time subscription for Appwrite");
      
      // Subscribe to serve attempts collection
      const unsubscribeServeAttempts = client.subscribe(`databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`, response => {
        console.log('Real-time update for serve attempts:', response);
        if (callback && typeof callback === 'function') {
          callback(response);
        }
      });
      
      // Subscribe to clients collection
      const unsubscribeClients = client.subscribe(`databases.${DATABASE_ID}.collections.${CLIENTS_COLLECTION_ID}.documents`, response => {
        console.log('Real-time update for clients:', response);
        window.dispatchEvent(new CustomEvent('client-updated', { detail: response }));
      });
      
      // Subscribe to cases collection
      const unsubscribeCases = client.subscribe(`databases.${DATABASE_ID}.collections.${CASES_COLLECTION_ID}.documents`, response => {
        console.log('Real-time update for cases:', response);
        window.dispatchEvent(new CustomEvent('cases-updated', { detail: response }));
      });
      
      // Return cleanup function
      return () => {
        console.log("Cleaning up real-time subscriptions");
        unsubscribeServeAttempts();
        unsubscribeClients();
        unsubscribeCases();
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      return () => {
        console.log('No cleanup needed due to subscription setup failure');
      };
    }
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
  },
  
  // Email functions
  async sendEmail(emailData) {
    try {
      const { to, subject, body, imageData, coordinates } = emailData;
      
      // Process recipients to array format
      const recipients = Array.isArray(to) ? [...to] : [to];
      
      // Ensure valid email format for each recipient
      for (const email of recipients) {
        if (!email || typeof email !== 'string' || !email.includes('@')) {
          console.error("Invalid recipient email address", email);
          return {
            success: false,
            message: `Invalid recipient email address: ${email}`
          };
        }
      }
      
      // Process image data if present
      const processedImageData = imageData 
        ? imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') 
        : undefined;
      
      // Call Appwrite function for sending email
      const execution = await functions.createExecution(
        'send-email',  // Your Appwrite function ID for email sending
        JSON.stringify({
          to: recipients,
          subject,
          body,
          imageData: processedImageData,
          imageFormat: imageData ? (imageData.includes('data:image/png') ? 'png' : 'jpeg') : undefined,
          coordinates: coordinates ? {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            accuracy: coordinates.accuracy
          } : undefined
        })
      );
      
      if (execution.status === 'completed') {
        console.log("Email sent successfully:", execution);
        return {
          success: true,
          message: `Email sent to ${recipients.join(", ")}`
        };
      } else {
        console.error("Error sending email:", execution);
        return {
          success: false,
          message: "Failed to send email"
        };
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to send email"
      };
    }
  },
  
  // Migration helper functions
  async migrateSupabaseToAppwrite() {
    try {
      console.log("Starting migration from Supabase to Appwrite");
      
      // 1. Migrate clients
      const clientsStr = localStorage.getItem("serve-tracker-clients");
      if (clientsStr) {
        const clients = JSON.parse(clientsStr);
        console.log(`Found ${clients.length} clients to migrate`);
        
        for (const client of clients) {
          try {
            await this.createClient(client);
            console.log(`Migrated client: ${client.name}`);
          } catch (error) {
            console.error(`Error migrating client ${client.id}:`, error);
          }
        }
      }
      
      // 2. Migrate serve attempts
      const servesStr = localStorage.getItem("serve-tracker-serves");
      if (servesStr) {
        const serves = JSON.parse(servesStr);
        console.log(`Found ${serves.length} serve attempts to migrate`);
        
        for (const serve of serves) {
          try {
            await this.createServeAttempt(serve);
            console.log(`Migrated serve attempt: ${serve.id}`);
          } catch (error) {
            console.error(`Error migrating serve attempt ${serve.id}:`, error);
          }
        }
      }
      
      console.log("Migration completed successfully");
      return {
        success: true,
        message: "Migration completed successfully"
      };
    } catch (error) {
      console.error("Error during migration:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Migration failed"
      };
    }
  },
  
  isAppwriteConfigured() {
    return !!import.meta.env.VITE_APPWRITE_PROJECT_ID && !!import.meta.env.VITE_APPWRITE_ENDPOINT;
  }
};

// Export singleton instance
export default appwrite;
