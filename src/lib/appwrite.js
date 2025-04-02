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

  // Add the setupRealtimeSubscription function
  setupRealtimeSubscription(callback) {
    try {
      console.log("Setting up realtime subscription for Appwrite");
      
      // Subscribe to all collections
      const unsubscribe = client.subscribe([
        `databases.${DATABASE_ID}.collections.${CLIENTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${CASES_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${DOCUMENTS_COLLECTION_ID}.documents`,
      ], (response) => {
        callback(response);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up Appwrite realtime subscription:", error);
      return () => {}; // Return empty cleanup function
    }
  },

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
      console.log('Updating client with data:', clientData);
      
      // Remove updated_at field as it's not in the schema
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
          notes: clientData.notes || ''
          // Removed updated_at field that was causing the error
        }
      );
      console.log('Client update response:', response);
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      console.error('Error details:', error.response || error.message);
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
      throw error;
    }
  },

  // Serve attempts operations
  async getServeAttempts() {
    try {
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID);
      
      // Map and sort the documents by timestamp (newest first)
      const formattedServes = response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client",
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        imageData: doc.image_data || null,
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      return formattedServes;
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
      // Convert each document to frontend format and sort by timestamp
      return response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client", 
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        imageData: doc.image_data || null,
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error(`Error fetching serve attempts for client ${clientId}:`, error);
      return [];
    }
  },

  async createServeAttempt(serveData) {
    try {
      console.log("Creating serve attempt in Appwrite with data:", {
        clientId: serveData.clientId,
        clientName: serveData.clientName,
        caseNumber: serveData.caseNumber
      });

      if (!serveData.clientId || serveData.clientId === "unknown") {
        throw new Error("Valid client ID is required for serve attempts.");
      }

      // Get client data to ensure we have client_name
      let clientName = serveData.clientName || "Unknown Client";
      if (clientName === "Unknown Client") {
        try {
          const client = await databases.getDocument(
            DATABASE_ID,
            CLIENTS_COLLECTION_ID,
            serveData.clientId
          );
          if (client && client.name) {
            clientName = client.name;
          }
        } catch (clientError) {
          console.warn("Could not fetch client name:", clientError);
        }
      }

      // Extract address - prioritize from serveData, fallback to case addresses
      const address = serveData.address || 
                     (typeof serveData.coordinates === 'string' ? 
                      `Coordinates: ${serveData.coordinates}` : 
                      "Address not provided");

      // Handle case number and name fields
      const caseNumber = serveData.caseNumber || "Not Specified";
      const caseName = serveData.caseName || "Unknown Case";

      // Format coordinates
      let coordinates = "0,0";
      if (serveData.coordinates) {
        if (typeof serveData.coordinates === 'string') {
          coordinates = serveData.coordinates;
        } else if (serveData.coordinates.latitude !== undefined && serveData.coordinates.longitude !== undefined) {
          coordinates = `${serveData.coordinates.latitude},${serveData.coordinates.longitude}`;
        }
      }

      // Generate document ID
      const documentId = ID.unique();

      // Create document with all required fields - REMOVE client_email as it's not in schema
      const payload = {
        client_id: serveData.clientId,
        client_name: clientName,
        case_number: caseNumber,
        case_name: caseName,
        status: serveData.status || "unknown",
        notes: serveData.notes || "",
        address: address,
        coordinates: coordinates,
        image_data: serveData.imageData || "",
        timestamp: serveData.timestamp ? serveData.timestamp.toISOString() : new Date().toISOString(),
        attempt_number: serveData.attemptNumber || 1,
      };

      // Store client email in local state but don't send to Appwrite
      const clientEmail = serveData.clientEmail;
      console.log("Client email will be stored locally but not in Appwrite:", clientEmail);

      // Create document without client_email field
      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        documentId,
        payload
      );

      // Add the client email back to the response for local use
      response.clientEmail = clientEmail;

      console.log("Serve attempt created successfully with ID:", response.$id);
      return response;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      throw error;
    }
  },

  async updateServeAttempt(serveId, serveData) {
    try {
      console.log("Updating serve attempt with data:", serveData);

      // Get the document ID - could be string or object with id/$id
      const docId = typeof serveId === 'object' ? (serveId.id || serveId.$id) : serveId;

      if (!docId) {
        throw new Error("Valid serve ID is required for updating");
      }

      // First, fetch the current document to preserve original data
      const originalDoc = await databases.getDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        docId
      );

      console.log("Original document:", originalDoc);

      // Prepare update data - only include fields that are actually being changed
      const updateData = {};
      
      // For string fields, update only if they differ from original and are not undefined
      if (serveData.notes !== undefined && serveData.notes !== originalDoc.notes) 
        updateData.notes = serveData.notes;
      
      if (serveData.status !== undefined && serveData.status !== originalDoc.status) 
        updateData.status = serveData.status;
      
      if (serveData.caseNumber !== undefined && serveData.caseNumber !== originalDoc.case_number) 
        updateData.case_number = serveData.caseNumber;
      
      // Handle Appwrite's snake_case format
      if (serveData.case_number !== undefined && serveData.case_number !== originalDoc.case_number) 
        updateData.case_number = serveData.case_number;
      
      // Never update these fields when editing to preserve original data
      // - timestamp (preserve original)
      // - client_id (preserve original relationship)
      // - client_name (preserve original)
      // - attempt_number (preserve original)
      // - image_data (preserve original unless explicitly provided)
      
      console.log("Updating document with fields:", updateData);

      // Only perform update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        const response = await databases.updateDocument(
          DATABASE_ID,
          SERVE_ATTEMPTS_COLLECTION_ID,
          docId,
          updateData
        );

        console.log("Update response:", response);

        // Sync with local storage
        await this.syncAppwriteServesToLocal();

        return response;
      } else {
        console.log("No fields to update");
        return originalDoc; // Return original document if no updates
      }
    } catch (error) {
      console.error('Error updating serve attempt:', error);
      throw error;
    }
  },

  async deleteServeAttempt(serveId) {
    try {
      if (!serveId) {
        console.warn("Invalid serveId provided to deleteServeAttempt:", serveId);
        return false; // Skip deletion if serveId is invalid
      }

      console.log(`Attempting to delete serve attempt with ID: ${serveId}`);
      await databases.deleteDocument(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID, serveId);
      console.log(`Successfully deleted serve attempt with ID: ${serveId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting serve attempt ${serveId}:`, error);
      throw error;
    }
  },

  async resolveClientId(fallbackClientId) {
    try {
      console.log(`Resolving client ID for fallback client_id: ${fallbackClientId}`);

      // Check client_cases table
      const cases = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.CASES_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (cases.documents.length > 0) {
        console.log(`Resolved client ID from client_cases: ${fallbackClientId}`);
        return fallbackClientId;
      }

      // Check client_documents table
      const documents = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.DOCUMENTS_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (documents.documents.length > 0) {
        console.log(`Resolved client ID from client_documents: ${fallbackClientId}`);
        return fallbackClientId;
      }

      // Check serve_attempts table
      const serves = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (serves.documents.length > 0) {
        console.log(`Resolved client ID from serve_attempts: ${fallbackClientId}`);
        return fallbackClientId;
      }

      console.warn(`Unable to resolve client ID for fallback client_id: ${fallbackClientId}`);
      return null;
    } catch (error) {
      console.error(`Error resolving client ID for fallback client_id: ${fallbackClientId}`, error);
      return null;
    }
  },

  async syncAppwriteServesToLocal() {
    try {
      // Fetch all serve attempts from Appwrite
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID);
      if (!response.documents || response.documents.length === 0) {
        console.log("No serve attempts found in Appwrite");
        return false;
      }

      // Convert to frontend format and sort by timestamp (newest first)
      const frontendServes = response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client",
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        imageData: doc.image_data || null,
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Store in local storage
      localStorage.setItem("serve-tracker-serves", JSON.stringify(frontendServes));
      window.dispatchEvent(new CustomEvent("serves-updated"));

      console.log(`Synced ${frontendServes.length} serve attempts from Appwrite to local storage`);
      return true;
    } catch (error) {
      console.error("Error syncing serve attempts from Appwrite:", error);
      return false;
    }
  },

  // Case operations
  async getClientCases(clientId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error(`Error fetching cases for client ${clientId}:`, error);
      return [];
    }
  },

  async createClientCase(caseData) {
    try {
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
      return response;
    } catch (error) {
      console.error('Error creating case:', error);
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
          case_number: caseData.caseNumber,
          case_name: caseData.caseName || "",
          description: caseData.description || "",
          home_address: caseData.homeAddress || "",
          work_address: caseData.workAddress || "",
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
  async uploadClientDocument(clientId, file, caseNumber, description) {
    try {
      const fileId = ID.unique();
      const fileUploadResponse = await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file
      );
      
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
      return document;
    } catch (error) {
      console.error('Error uploading client document:', error);
      throw error;
    }
  },

  async getClientDocuments(clientId, caseNumber) {
    try {
      const queries = [Query.equal('client_id', clientId)];
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
      return [];
    }
  },

  async deleteClientDocument(docId, fileId) {
    try {
      console.log(`Attempting to delete document with ID: ${docId} and fileId: ${fileId}`);

      // Validate fileId
      if (fileId && (!/^[a-zA-Z0-9_]{1,36}$/.test(fileId) || fileId.startsWith('_'))) {
        console.warn(`Invalid fileId: ${fileId}. Skipping file deletion.`);
      } else if (fileId) {
        await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
        console.log(`Successfully deleted file with fileId: ${fileId}`);
      }

      // Delete the document from the database
      await databases.deleteDocument(DATABASE_ID, DOCUMENTS_COLLECTION_ID, docId);
      console.log(`Successfully deleted document with ID: ${docId}`);
      return true;
    } catch (error) {
      console.error('Error deleting client document:', error);
      throw error;
    }
  }
};
