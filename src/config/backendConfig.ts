// Backend configuration
// This file manages which backend service the app uses

export const BACKEND_PROVIDER = {
  APPWRITE: 'appwrite',
};

// Set the active backend - we'll only use Appwrite now
export const ACTIVE_BACKEND = BACKEND_PROVIDER.APPWRITE;

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '67ead974001245b7c6aa',
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '67eae6fe0020c6721531',
  collections: {
    clients: import.meta.env.VITE_APPWRITE_CLIENTS_COLLECTION_ID || '67eae70e000c042112c8',
    serveAttempts: import.meta.env.VITE_APPWRITE_SERVE_ATTEMPTS_COLLECTION_ID || '67eae7ef0034c7ad35f6',
    clientCases: import.meta.env.VITE_APPWRITE_CLIENT_CASES_COLLECTION_ID || '67eae98f0017c9503bee',
    clientDocuments: import.meta.env.VITE_APPWRITE_CLIENT_DOCUMENTS_COLLECTION_ID || '67eaeaa900128f318514',
  },
  storageBucket: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '67eaeaea000e8d41358d',
  functionIds: {
    sendEmail: import.meta.env.VITE_APPWRITE_EMAIL_FUNCTION_ID || '67eaeaf9000c3d9de7c5',
  }
};

// Empty Supabase config for backward compatibility
export const SUPABASE_CONFIG = {
  url: "",
  anonKey: ""
};

// Helper function to determine if Appwrite is configured
export const isAppwriteConfigured = () => {
  return !!APPWRITE_CONFIG.projectId && !!APPWRITE_CONFIG.endpoint;
};
