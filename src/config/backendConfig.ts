
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
  databaseId: '67eae6fe0020c6721531',
  collections: {
    clients: '67eae70e000c042112c8',
    clientCases: '67eae98f0017c9503bee',
    serveAttempts: '67eae7ef0034c7ad35f6',
    clientDocuments: '67eaeaa900128f318514',
  },
  storageBucket: import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID || '67eaeb7700322d74597e',
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
