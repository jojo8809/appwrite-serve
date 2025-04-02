
// Import any necessary types or utilities here
import { appwrite } from '@/lib/appwrite';

// Define a type for client data to fix the object property access issues
interface ClientData {
  id: string;
  name: string;
  email: string;
  additionalEmails: string[];
  phone: string;
  address: string;
  notes: string;
  [key: string]: any; // Allow other properties
}

// Extend the Window interface to include our debug tools
declare global {
  interface Window {
    inspectAppwriteConfig: () => void;
    fixClientIdsInServeAttempts: () => Promise<{ message: string; fixed: number }>;
    testCreateClient: () => Promise<{ success: boolean; client?: any; error?: any }>;
    testDeleteClient: (clientId: string) => void;
    listClients: () => Promise<{ success: boolean; clients?: any[]; error?: any }>;
  }
}

// Initialize debug tools for development environment
export function initializeDebugTools() {
  console.log('Debug tools initialized');

  // Add a function to the window object to inspect Appwrite configuration
  window.inspectAppwriteConfig = () => {
    console.log('Appwrite Config:', {
      endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
      databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
      clientsCollectionId: import.meta.env.VITE_APPWRITE_CLIENTS_COLLECTION_ID,
      serveAttemptsCollectionId: import.meta.env.VITE_APPWRITE_SERVE_ATTEMPTS_COLLECTION_ID,
      clientCasesCollectionId: import.meta.env.VITE_APPWRITE_CLIENT_CASES_COLLECTION_ID,
      clientDocumentsCollectionId: import.meta.env.VITE_APPWRITE_CLIENT_DOCUMENTS_COLLECTION_ID,
      storageBucketId: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID,
      emailFunctionId: import.meta.env.VITE_APPWRITE_EMAIL_FUNCTION_ID,
    });
  };

  // Add client data repair function to window object
  window.fixClientIdsInServeAttempts = async function() {
    try {
      console.log('Attempting to fix client IDs in serve attempts...');
      const serveAttempts = await appwrite.getServeAttempts();
      let fixedCount = 0;

      for (const serve of serveAttempts) {
        if (!serve.client_id || serve.client_id === 'unknown') {
          console.warn(`Serve attempt ${serve.$id} has an invalid client ID. Attempting to fix...`);
          
          // Fetch the first client as a default
          const clients = await appwrite.getClients();
          if (clients && clients.length > 0) {
            const firstClientId = clients[0].$id;
            console.log(`Updating serve attempt ${serve.$id} with client ID: ${firstClientId}`);
            await appwrite.databases.updateDocument(
              appwrite.DATABASE_ID,
              appwrite.SERVE_ATTEMPTS_COLLECTION_ID,
              serve.$id,
              { client_id: firstClientId }
            );
            fixedCount++;
          } else {
            console.warn('No clients found. Cannot fix serve attempts.');
            return { message: 'No clients found. Cannot fix serve attempts.', fixed: 0 };
          }
        }
      }

      console.log(`Fixed ${fixedCount} serve attempts with invalid client IDs.`);
      return { message: `Fixed ${fixedCount} serve attempts with invalid client IDs.`, fixed: fixedCount };
    } catch (error) {
      console.error('Error fixing client IDs in serve attempts:', error);
      return { message: `Error fixing client IDs: ${error.message}`, fixed: 0 };
    }
  };

  // Add function to test client creation
  window.testCreateClient = async function() {
    try {
      // Define client with correct type
      const clientData: ClientData = {
        id: '', 
        name: 'Test Client',
        email: 'test@example.com',
        additionalEmails: [],
        phone: '555-123-4567',
        address: '123 Test Street',
        notes: 'Created for testing'
      };

      // Create a test client using the Appwrite SDK
      const newClient = await appwrite.createClient(clientData);

      console.log('Test client created:', newClient);
      return { success: true, client: newClient };
    } catch (error) {
      console.error('Error creating test client:', error);
      return { success: false, error };
    }
  };

  // Add function to list all clients
  window.listClients = async function() {
    try {
      const clients = await appwrite.getClients();
      console.log('Listing all clients:', clients);
      return { success: true, clients };
    } catch (error) {
      console.error('Error listing clients:', error);
      return { success: false, error };
    }
  };
}
