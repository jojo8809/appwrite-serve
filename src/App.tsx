import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewServe from './pages/NewServe';
import Clients from './pages/Clients';
import History from './pages/History';
import Settings from './pages/Settings';
import Index from './pages/Index';
import MigrationPage from './pages/Migration';
import DataExport from './pages/DataExport';
import { ServeAttemptData } from './components/ServeAttempt';
import { ClientData } from './components/ClientForm';
import { appwrite } from './lib/appwrite';
import {
  checkAppwriteConnection,
  loadDataFromAppwrite,
  clearLocalStorage,
  getActiveBackend,
} from "./utils/dataSwitch";
import { BACKEND_PROVIDER } from "./config/backendConfig";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
    mutations: {
      onError: (error) => {
        console.error("Mutation error:", error);
      }
    }
  }
});

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientData[]>(() => {
    const savedClients = localStorage.getItem("serve-tracker-clients");
    return savedClients ? JSON.parse(savedClients) : [];
  });
  const [serves, setServes] = useState<ServeAttemptData[]>(() => {
    const savedServes = localStorage.getItem("serve-tracker-serves");
    console.log("Initial load from localStorage serve-tracker-serves:", 
      savedServes ? JSON.parse(savedServes).length : 0, "entries");
    return savedServes ? JSON.parse(savedServes) : [];
  });
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showAppwriteAlert, setShowAppwriteAlert] = useState(false);

  // Check Appwrite connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      const isAppwriteConnected = await checkAppwriteConnection();
      if (isAppwriteConnected) {
        console.log("Using Appwrite as primary backend");
        // Set up Appwrite real-time subscription
        const cleanup = appwrite.setupRealtimeSubscription((response) => {
          console.log("Received real-time update from Appwrite:", response);
          // Refresh data when changes happen
          loadAppwriteData();
        });
        return cleanup;
      } else {
        console.log("Failed to connect to Appwrite, using local storage fallback");
        setShowAppwriteAlert(true);
        return () => {}; // No cleanup needed for fallback
      }
    };
    checkBackend();
  }, []);

  const loadAppwriteData = async () => {
    try {
      setIsSyncing(true);
      const { clients: appwriteClients, serves: appwriteServes } = await loadDataFromAppwrite();
      if (appwriteClients.length > 0) {
        setClients(appwriteClients);
        localStorage.setItem("serve-tracker-clients", JSON.stringify(appwriteClients));
      }
      if (appwriteServes.length > 0) {
        setServes(appwriteServes);
        localStorage.setItem("serve-tracker-serves", JSON.stringify(appwriteServes));
      }
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading data from Appwrite:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const performInitialSync = async () => {
      if (isInitialSync) {
        setIsSyncing(true);
        try {
          console.log("Performing initial sync from Appwrite");
          await loadAppwriteData();
        } catch (error) {
          console.error("Error during initial sync:", error);
        } finally {
          setIsSyncing(false);
          setIsInitialSync(false);
        }
      }
    };
    performInitialSync();
  }, [isInitialSync]);

  // Set up periodic sync with Appwrite
  useEffect(() => {
    // Set up Appwrite sync interval
    const syncInterval = setInterval(async () => {
      try {
        console.log("Running periodic sync with Appwrite...");
        await loadAppwriteData();
      } catch (error) {
        console.error("Error during periodic sync with Appwrite:", error);
      }
    }, 5000);
    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Save clients to localStorage when they change
  useEffect(() => {
    localStorage.setItem("serve-tracker-clients", JSON.stringify(clients));
    console.log("Updated localStorage serve-tracker-clients:", clients.length, "clients");
  }, [clients]);

  // Save serves to localStorage when they change
  useEffect(() => {
    localStorage.setItem("serve-tracker-serves", JSON.stringify(serves));
    console.log("Updated localStorage serve-tracker-serves:", serves.length, "entries");
  }, [serves]);

  // Create a new client
  const createClient = async (client) => {
    try {
      console.log("Creating new client in Appwrite:", client);
      const newClient = await appwrite.createClient(client);
      if (newClient) {
        toast({
          title: "Client created",
          description: "New client has been added successfully",
          variant: "success",
        });
        const clientData = {
          id: newClient.$id,
          name: newClient.name,
          email: newClient.email,
          additionalEmails: newClient.additional_emails || [],
          phone: newClient.phone,
          address: newClient.address,
          notes: newClient.notes,
        };
        setClients(prev => [...prev, clientData]);
        setTimeout(() => {
          loadAppwriteData();
        }, 500);
        return clientData;
      }
    } catch (error) {
      console.error("Error creating client in Appwrite:", error);
      toast({
        title: "Error creating client",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an existing client
  const updateClient = async (updatedClient) => {
    try {
      console.log("Updating client in Appwrite:", updatedClient);
      const result = await appwrite.updateClient(updatedClient.id, {
        name: updatedClient.name,
        email: updatedClient.email,
        additionalEmails: updatedClient.additionalEmails || [],
        phone: updatedClient.phone,
        address: updatedClient.address,
        notes: updatedClient.notes,
      });
      if (result) {
        toast({
          title: "Client updated",
          description: "Client has been successfully updated",
          variant: "success",
        });
        setClients(prev => prev.map(client => 
          client.id === updatedClient.id ? updatedClient : client
        ));
        setTimeout(() => {
          loadAppwriteData();
        }, 500);
      }
    } catch (error) {
      console.error("Error updating client in Appwrite:", error);
      toast({
        title: "Error updating client",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  // Delete a client
  const deleteClient = async (clientId) => {
    try {
      // Delete associated serve attempts
      const serveAttempts = await appwrite.getServeAttempts();
      const clientServes = serveAttempts.filter(serve => serve.clientId === clientId);
      for (const serve of clientServes) {
        await appwrite.deleteServeAttempt(serve.$id);
      }
      // Delete associated documents
      const documents = await appwrite.getClientDocuments(clientId);
      for (const doc of documents) {
        await appwrite.deleteClientDocument(doc.$id, doc.filePath);
      }
      // Delete the client
      await appwrite.deleteClient(clientId);
      setClients(prev => prev.filter(client => client.id !== clientId));
      setServes(prev => prev.filter(serve => serve.clientId !== clientId));
      toast({
        title: "Client deleted",
        description: "Client and associated data have been removed",
        variant: "success",
      });
      setTimeout(() => {
        loadAppwriteData();
      }, 500);
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error deleting client",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  // Create a new serve attempt
  const addServe = async (serveData) => {
    try {
      const newServe = await appwrite.createServeAttempt({
        ...serveData,
        date: serveData.timestamp.toLocaleDateString(),
        time: serveData.timestamp.toLocaleTimeString(),
      });
      const formattedServe = {
        id: newServe.$id,
        clientId: newServe.clientId,
        imageData: newServe.imageData,
        coordinates: newServe.coordinates,
        notes: newServe.notes,
        status: newServe.status,
        timestamp: new Date(newServe.created_at || new Date()),
        attemptNumber: serveData.attemptNumber,
        caseNumber: newServe.caseNumber,
      };
      setServes(prev => [...prev, formattedServe]);
      toast({
        title: "Serve recorded",
        description: "Service attempt has been saved successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      toast({
        title: "Error saving serve attempt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update a serve attempt
  const updateServe = async (serveData) => {
    try {
      const updatedServe = await appwrite.updateServeAttempt(serveData.id, {
        ...serveData,
        date: serveData.timestamp.toLocaleDateString(),
        time: serveData.timestamp.toLocaleTimeString(),
      });
      setServes(prev => prev.map(serve => 
        serve.id === serveData.id ? serveData : serve
      ));
      toast({
        title: "Serve updated",
        description: "Service attempt has been updated successfully",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error("Error updating serve attempt:", error);
      toast({
        title: "Error updating serve attempt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a serve attempt
  const deleteServe = async (serveId) => {
    try {
      await appwrite.deleteServeAttempt(serveId);
      setServes(prev => prev.filter(serve => serve.id !== serveId));
      toast({
        title: "Serve deleted",
        description: "Service attempt has been removed",
        variant: "success",
      });
      return true;
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error deleting serve attempt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <>
      {showAppwriteAlert && (
        <Alert className="m-4">
          <AlertTitle>Connection Warning</AlertTitle>
          <AlertDescription>
            Unable to connect to Appwrite. Operating in offline mode with local storage.
            <div className="mt-2">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <Routes location={location}>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={
            <Dashboard clients={clients} serves={serves} />
          } />
          <Route path="/new-serve" element={
            <NewServe clients={clients} addServe={addServe} />
          } />
          <Route path="/new-serve/:clientId" element={
            <NewServe clients={clients} addServe={addServe} />
          } />
          <Route path="/clients" element={
            <Clients 
              clients={clients} 
              addClient={createClient}
              updateClient={updateClient}
              deleteClient={deleteClient}
            />
          } />
          <Route path="/history" element={
            <History 
              serves={serves} 
              clients={clients}
              deleteServe={deleteServe}
              updateServe={updateServe}
            />
          } />
          <Route path="/migration" element={<MigrationPage />} />
          <Route path="/export" element={<DataExport />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnimatedRoutes />
    </QueryClientProvider>
  );
}
