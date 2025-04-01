import { appwrite } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/config/backendConfig';

// Add this to the window object for console debugging
declare global {
  interface Window {
    appwriteDebug: any;
  }
}

export const initializeDebugTools = () => {
  // Create debug object with all test functions
  window.appwriteDebug = {
    config: {
      ...APPWRITE_CONFIG,
      endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint,
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId,
    },
    
    // Test client operations
    clients: {
      list: async () => {
        console.log('Fetching all clients...');
        try {
          const clients = await appwrite.getClients();
          console.log('Clients:', clients);
          return clients;
        } catch (error) {
          console.error('Error fetching clients:', error);
          return null;
        }
      },
      create: async (name) => {
        try {
          const client = await appwrite.createClient({
            name: name || 'Test Client',
            email: `test-${Date.now()}@example.com`,
            phone: '555-123-4567',
            address: '123 Test St',
            notes: 'Created via debug tool'
          });
          console.log('Created client:', client);
          return client;
        } catch (error) {
          console.error('Error creating client:', error);
          return null;
        }
      },
      delete: async (clientId) => {
        try {
          console.log(`Deleting client ${clientId}...`);
          const result = await appwrite.deleteClient(clientId);
          console.log('Delete result:', result);
          return result;
        } catch (error) {
          console.error('Error deleting client:', error);
          return null;
        }
      }
    },
    
    // Test case operations
    cases: {
      list: async (clientId) => {
        try {
          console.log(`Fetching cases for client ${clientId}...`);
          const cases = await appwrite.getClientCases(clientId);
          console.log('Cases:', cases);
          return cases;
        } catch (error) {
          console.error('Error fetching cases:', error);
          return null;
        }
      },
      create: async (clientId) => {
        try {
          const caseData = {
            clientId: clientId,
            caseNumber: `CASE-${Date.now()}`,
            caseName: 'Test Case',
            description: 'Created via debug tool',
            status: 'Active',
            homeAddress: '123 Home St',
            workAddress: '456 Work Ave'
          };
          console.log('Creating case with data:', caseData);
          const result = await appwrite.createClientCase(caseData);
          console.log('Case creation result:', result);
          return result;
        } catch (error) {
          console.error('Error creating case:', error);
          return null;
        }
      },
      update: async (caseId, caseData = {}) => {
        try {
          console.log(`Updating case ${caseId}...`);
          const defaultData = {
            caseNumber: `UPDATED-${Date.now()}`,
            caseName: 'Updated Test Case',
            description: 'Updated via debug tool',
            status: 'Pending',
            homeAddress: '123 Updated Home St',
            workAddress: '456 Updated Work Ave'
          };
          
          const updateData = { ...defaultData, ...caseData };
          console.log('Update data:', updateData);
          
          const result = await appwrite.updateClientCase(caseId, updateData);
          console.log('Case update result:', result);
          return result;
        } catch (error) {
          console.error('Error updating case:', error);
          return null;
        }
      }
    },
    
    // Test raw Appwrite access
    raw: {
      listDocuments: async (collectionId, queries = []) => {
        try {
          console.log(`Listing documents in ${collectionId}...`);
          const result = await appwrite.databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            collectionId,
            queries
          );
          console.log('Documents:', result);
          return result;
        } catch (error) {
          console.error('Error listing documents:', error);
          return null;
        }
      },
      upload: async (clientId, caseNumber = '') => {
        try {
          // Create a simple text file
          const content = `Test file created at ${new Date().toISOString()}`;
          const blob = new Blob([content], { type: 'text/plain' });
          const file = new File([blob], `test-${Date.now()}.txt`, { type: 'text/plain' });
          
          console.log(`Uploading document for client ${clientId}...`);
          const result = await appwrite.uploadClientDocument(
            clientId, 
            file, 
            caseNumber, 
            'Uploaded via debug tool'
          );
          console.log('Document upload result:', result);
          return result;
        } catch (error) {
          console.error('Error uploading document:', error);
          return null;
        }
      }
    },
    
    // Help command
    help: () => {
      console.log('AppwriteDebug available commands:');
      console.log('- appwriteDebug.config - Show current Appwrite configuration');
      console.log('- appwriteDebug.clients.list() - List all clients');
      console.log('- appwriteDebug.clients.create("Name") - Create a test client');
      console.log('- appwriteDebug.clients.delete("clientId") - Delete a client');
      console.log('- appwriteDebug.cases.list("clientId") - List cases for a client');
      console.log('- appwriteDebug.cases.create("clientId") - Create a test case');
      console.log('- appwriteDebug.cases.update("caseId", { caseData }) - Update a test case');
      console.log('- appwriteDebug.raw.listDocuments("collectionId") - List raw documents');
      console.log('- appwriteDebug.raw.upload("clientId", "caseNumber") - Upload a document');
    }
  };
  
  console.log('Appwrite debug tools initialized. Type appwriteDebug.help() for commands.');
};
