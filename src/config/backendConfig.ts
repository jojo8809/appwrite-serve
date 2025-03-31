
// Backend configuration
// This file manages which backend service the app uses

export const BACKEND_PROVIDER = {
  SUPABASE: 'supabase',
  APPWRITE: 'appwrite'
};

// Change this value to switch between backends
// Set to 'appwrite' to use Appwrite, or 'supabase' to use Supabase
export const ACTIVE_BACKEND = BACKEND_PROVIDER.APPWRITE;

// Appwrite configuration
export const APPWRITE_CONFIG = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '67ead974001245b7c6aa',
  databaseId: '67eae6fe0020c6721531', // serve-tracker-db
  collections: {
    clients: '67eae70e000c042112c8',
    serveAttempts: '67eae7ef0034c7ad35f6',
    clientCases: '67eae98f0017c9503bee',
    clientDocuments: '67eaeaa900128f318514'
  },
  storageBucket: 'client-documents'
};

// Supabase configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://qdjdmicjzmpggctzjsrf.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkamRtaWNqem1wZ2djdHpqc3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MTAxODIsImV4cCI6MjA1ODI4NjE4Mn0.St9w_1cd-8yr0vsL6tYQ0MgiQJeqV7-fw6TIursi0I8'
};

// Helper function to determine if Appwrite is configured
export const isAppwriteConfigured = () => {
  return !!APPWRITE_CONFIG.projectId && !!APPWRITE_CONFIG.endpoint;
};

// Helper function to determine if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!SUPABASE_CONFIG.url && !!SUPABASE_CONFIG.anonKey;
};
