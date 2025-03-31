import api from '../services/api';

/**
 * Sets up a polling mechanism to periodically fetch data
 * This replaces Supabase real-time subscriptions
 */
export const setupPolling = (callback, interval = 15000) => {
  console.log(`Setting up polling with interval: ${interval}ms`);
  
  const timerId = setInterval(async () => {
    try {
      // Fetch updated data
      const response = await api.get('/serves');
      if (response.data) {
        callback(response.data);
      }
    } catch (error) {
      console.error("Error polling for updates:", error);
    }
  }, interval);
  
  // Return a cleanup function
  return () => {
    console.log("Cleaning up polling interval");
    clearInterval(timerId);
  };
};

/**
 * Sync serve attempts from server to local storage
 */
export const syncServesToLocal = async () => {
  try {
    console.log("Syncing serve attempts from server to local storage");
    
    const response = await api.get('/serves');
    const serves = response.data;
    
    if (serves && serves.length > 0) {
      const formattedServes = serves.map(serve => ({
        id: serve._id,
        clientId: serve.client_id,
        caseNumber: serve.case_number,
        status: serve.status,
        notes: serve.notes,
        coordinates: serve.coordinates,
        timestamp: serve.timestamp,
        imageData: serve.image_data,
        attemptNumber: serve.attempt_number
      }));
      
      localStorage.setItem("serve-tracker-serves", JSON.stringify(formattedServes));
      console.log(`Synced ${formattedServes.length} serve attempts to local storage`);
      return formattedServes;
    } else {
      console.log("No serve attempts received from server");
      localStorage.setItem("serve-tracker-serves", JSON.stringify([]));
      return [];
    }
  } catch (error) {
    console.error("Error syncing server data to local:", error);
    return null;
  }
};
