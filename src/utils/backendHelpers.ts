
import { ACTIVE_BACKEND, BACKEND_PROVIDER } from '@/config/backendConfig';
import { supabase } from '@/lib/supabase';
import { appwrite } from '@/lib/appwrite';
import { toast } from 'sonner';

// Helper function to check which backend is currently active
export const isUsingAppwrite = () => {
  return ACTIVE_BACKEND === BACKEND_PROVIDER.APPWRITE;
};

// Helper function to check if we're properly connected to the active backend
export const checkBackendConnection = async () => {
  if (isUsingAppwrite()) {
    try {
      const clients = await appwrite.getClients();
      return { connected: true, provider: 'Appwrite' };
    } catch (error) {
      console.error("Appwrite connection check failed:", error);
      return { connected: false, provider: 'Appwrite', error };
    }
  } else {
    try {
      const { data, error } = await supabase.from('clients').select('id').limit(1);
      if (error) throw error;
      return { connected: true, provider: 'Supabase' };
    } catch (error) {
      console.error("Supabase connection check failed:", error);
      return { connected: false, provider: 'Supabase', error };
    }
  }
};

// Helper function to switch backends
export const switchBackend = (targetBackend: string) => {
  // This function would need to update a configuration file or localStorage
  // For now, it just displays a message that requires app reload
  toast.info(`Switching to ${targetBackend} requires an application restart`, {
    description: "Please reload the application after making this change in the configuration file"
  });
};

// Helper to get displayable backend information
export const getBackendInfo = () => {
  return {
    name: isUsingAppwrite() ? "Appwrite" : "Supabase",
    icon: isUsingAppwrite() ? "⚡" : "⚡️",
    color: isUsingAppwrite() ? "bg-indigo-500" : "bg-emerald-500"
  };
};

export default {
  isUsingAppwrite,
  checkBackendConnection,
  switchBackend,
  getBackendInfo
};
