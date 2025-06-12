import { Client, Account, Databases, Storage, ID, Query, Teams, Functions } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/backendConfig';
import { createServeEmailBody } from "@/utils/email"; 

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
  collections: APPWRITE_CONFIG.collections,
  CLIENTS_COLLECTION_ID,
  SERVE_ATTEMPTS_COLLECTION_ID,
  CASES_COLLECTION_ID,
  DOCUMENTS_COLLECTION_ID,
  STORAGE_BUCKET_ID,

  // Add messaging functionality for SMTP integration
  async sendMessage(payload, providerId, topicId) {
    try {
      console.log(`Sending message via Appwrite messaging with provider ${providerId} and topic ${topicId}`);
      console.log("Message payload:", {
        subject: payload.subject,
        recipients: payload.recipients,
        hasImageData: !!payload.imageData,
      });

      // Check if we have the necessary data
      if (!payload.subject || !payload.content || !payload.recipients) {
        throw new Error("Missing required fields for email: subject, content, or recipients");
      }

      try {
        // Using Appwrite functions to send the email via the topic subscription
        const result = await functions.createExecution(
          "sendEmail",
          JSON.stringify({
            subject: payload.subject,
            html: payload.content,
            to: payload.recipients.split(", ")
          }),
          false, // async execution
          "", // no path
          "POST", // method
          {} // no headers
        );
        
        console.log("Email function execution result:", result);
        
        // If execution was successfully created but we need to check for its status
        if (result.$id) {
          return { 
            success: true,
            id: result.$id,
            message: "Email send request has been queued"
          };
        } else {
          throw new Error("Function execution created but no ID returned");
        }
      } catch (fnError) {
        console.error("Error executing email function:", fnError);
        
        // Fallback to direct messaging API
        console.log("Falling back to direct messaging API call");
        
        // If function execution fails, try direct API call
        const endpoint = `${client.config.endpoint}/messaging/topics/${topicId}/subscribers`;
        
        const headers = {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': client.config.project,
        };
        
        if (client.config.key) {
          headers['X-Appwrite-Key'] = client.config.key;
        } else if (client.config.jwt) {
          headers['X-Appwrite-JWT'] = client.config.jwt;
        }
        
        // Create the message data
        const messageData = {
          userId: 'unique',
          providerType: 'smtp',
          providerId: providerId,
          targetId: payload.recipients,
          content: {
            subject: payload.subject,
            html: payload.content,
          },
          metadata: payload.metadata || {},
        };
        
        // If we have an image, add it to the message
        if (payload.imageData) {
          messageData.content.attachments = [{
            content: payload.imageData,
            filename: 'serve_evidence.jpeg',
            disposition: 'attachment'
          }];
        }
        
        // Make the API request
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(messageData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to send message: ${errorData.message || response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Message sent successfully via API:", result);
        return result;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // Add a method to call the Appwrite email function
  async sendEmailViaFunction(emailData) {
    try {
      // Ensure the business email is included
      const businessEmail = 'info@justlegalsolutions.org';
      const recipients = Array.isArray(emailData.to) ? [...emailData.to] : [emailData.to];
      if (!recipients.some(email => email.toLowerCase() === businessEmail.toLowerCase())) {
        recipients.push(businessEmail);
      }

      const response = await functions.createExecution(
        "67ed8899003a8b119a18", // Correct function ID
        JSON.stringify({ ...emailData, to: recipients })
      );

      if (response.status === "completed") {
        console.log("Email function executed successfully:", response);
        return { success: true, message: "Email sent successfully" };
      } else {
        console.error("Email function execution failed:", response);
        return { success: false, message: "Email function execution failed" };
      }
    } catch (error) {
      console.error("Error calling email function:", error);
      return { success: false, message: error.message };
    }
  },

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
        address: doc.address || "",
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
        address: doc.address || "",
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
        caseNumber: serveData.caseNumber,
        caseName: serveData.caseName
      });

      if (!serveData.clientId || serveData.clientId === "unknown") {
        throw new Error("Valid client ID is required for serve attempts.");
      }

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

      const address = serveData.address || 
                      (typeof serveData.coordinates === 'string' ? 
                       `Coordinates: ${serveData.coordinates}` : 
                       "Address not provided");

      const caseNumber = serveData.caseNumber || "Not Specified";
      const caseName = serveData.caseName || "Unknown Case";

      let coordinates = "0,0";
      if (serveData.coordinates) {
        if (typeof serveData.coordinates === 'string') {
          coordinates = serveData.coordinates;
        } else if (serveData.coordinates.latitude !== undefined && serveData.coordinates.longitude !== undefined) {
          coordinates = `${serveData.coordinates.latitude},${serveData.coordinates.longitude}`;
        }
      }

      const documentId = ID.unique();

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
        timestamp: serveData.timestamp ? 
                   (serveData.timestamp instanceof Date ? 
                    serveData.timestamp.toISOString() : 
                    new Date(serveData.timestamp).toISOString()) : 
                   new Date().toISOString(),
        attempt_number: serveData.attemptNumber || 1,
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        documentId,
        payload
      );
      
      console.log("Serve attempt created successfully with ID:", response.$id);
      
      if (serveData.clientEmail) {
        response.clientEmail = serveData.clientEmail;
      }
      
      try {
        const emailBody = createServeEmailBody(
          response.client_name,
          response.address,
          response.notes,
          new Date(response.timestamp),
          response.coordinates,
          response.attempt_number,
          response.case_name
        );
    
        const emailData = {
          to: serveData.clientEmail || "info@justlegalsolutions.org",
          subject: `New Serve Attempt Created - ${response.case_name}`,
          html: emailBody,
          imageData: response.image_data, 
          serveId: response.$id // We now pass the ID from the successfully created document.
        };
    
        console.log("Sending email with confirmed serveId:", response.$id);
        const emailResult = await this.sendEmailViaFunction(emailData);
    
        if (emailResult.success) {
          console.log("Email sent successfully:", emailResult.message);
        } else {
          console.error("Failed to send email:", emailResult.message);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
      
      return response;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      
      try {
        console.log("Saving serve attempt to local storage as fallback");
        const serveAttempts = JSON.parse(localStorage.getItem("serve-tracker-serves") || "[]");
        const newServe = {
          id: ID.unique(),
          clientId: serveData.clientId,
          clientName: serveData.clientName || "Unknown Client",
          clientEmail: serveData.clientEmail,
          caseNumber: serveData.caseNumber || "Unknown",
          caseName: serveData.caseName || "Unknown Case",
          coordinates: serveData.coordinates || null,
          notes: serveData.notes || "",
          status: serveData.status || "unknown",
          timestamp: new Date(),
          attemptNumber: serveData.attemptNumber || 1,
          imageData: serveData.imageData || null,
          address: serveData.address || ""
        };
        serveAttempts.push(newServe);
        localStorage.setItem("serve-tracker-serves", JSON.stringify(serveAttempts));
        console.log("Saved to local storage successfully");
        return newServe;
      } catch (localError) {
        console.error("Failed local storage fallback:", localError);
      }
      
      throw error;
    }
  },

  async updateServeAttempt(serveId, serveData) {
    try {
      console.log("Updating serve attempt with data:", serveData);

      const docId = typeof serveId === 'object' ? (serveId.id || serveId.$id) : serveId;

      if (!docId) {
        throw new Error("Valid serve ID is required for updating");
      }

      const originalDoc = await databases.getDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        docId
      );

      console.log("Original document:", originalDoc);

      const updateData = {};
      
      if (serveData.notes !== undefined && serveData.notes !== originalDoc.notes) 
        updateData.notes = serveData.notes;
      
      if (serveData.status !== undefined && serveData.status !== originalDoc.status) 
        updateData.status = serveData.status;
      
      if (serveData.caseNumber !== undefined && serveData.caseNumber !== originalDoc.case_number) 
        updateData.case_number = serveData.caseNumber;
      
      if (serveData.caseName !== undefined && serveData.caseName !== originalDoc.case_name) 
        updateData.case_name = serveData.caseName;
      
      console.log("Updating document with fields:", updateData);

      if (Object.keys(updateData).length > 0) {
        const response = await databases.updateDocument(
          DATABASE_ID,
          SERVE_ATTEMPTS_COLLECTION_ID,
          docId,
          updateData
        );

        console.log("Update response:", response);

        await this.syncAppwriteServesToLocal();

        return response;
      } else {
        console.log("No fields to update");
        return originalDoc;
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
        return false;
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

      const cases = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (cases.documents.length > 0) {
        console.log(`Resolved client ID from client_cases: ${fallbackClientId}`);
        return fallbackClientId;
      }

      const documents = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (documents.documents.length > 0) {
        console.log(`Resolved client ID from client_documents: ${fallbackClientId}`);
        return fallbackClientId;
      }

      const serves = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
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
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID);
      if (!response.documents || response.documents.length === 0) {
        console.log("No serve attempts found in Appwrite");
        return false;
      }

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
        address: doc.address || "",
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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
