
import React, { useState, useEffect } from "react";
import ServeHistory from "@/components/ServeHistory";
import { ClientData } from "@/components/ClientForm";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditServeDialog from "@/components/EditServeDialog";
import { appwrite } from "@/lib/appwrite";
import { repairServeAttempts } from "@/utils/repairUtils";
import { normalizeServeDataArray, addClientNamesToServes } from "@/utils/dataNormalization";

interface HistoryProps {
  serves: ServeAttemptData[];
  clients: ClientData[];
  deleteServe: (id: string) => Promise<boolean>;
  updateServe: (serve: ServeAttemptData) => Promise<boolean>;
}

const History: React.FC<HistoryProps> = ({ 
  serves, 
  clients, 
  deleteServe,
  updateServe
}) => {
  console.log("History page received serves:", serves);
  console.log("History page received clients:", clients);

  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedServe, setSelectedServe] = useState<ServeAttemptData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [localServes, setLocalServes] = useState<ServeAttemptData[]>([]);
  const { toast } = useToast();

  // Effect to use serves prop if available, otherwise fetch from local storage or directly from Appwrite
  useEffect(() => {
    if (serves && serves.length > 0) {
      console.log("Using serves from props:", serves);
      const validatedServes = validateServes(serves);
      
      // Enhance serve data with client names
      const enhancedServes = addClientNamesToServes(validatedServes, clients);
      
      // Sort serves by timestamp in descending order (newest first)
      const sortedServes = sortServesByDate(enhancedServes);
      setLocalServes(sortedServes);
    } else {
      console.log("No serves from props, fetching from local storage or Appwrite");
      fetchServeHistory();
    }
  }, [serves, clients]);

  // Helper function to sort serves by date (newest first)
  const sortServesByDate = (servesToSort: ServeAttemptData[]): ServeAttemptData[] => {
    return [...servesToSort].sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA; // Descending order (newest first)
    });
  };

  const fetchServeHistory = async () => {
    try {
      console.log("Fetching serve history...");
      setIsSyncing(true);
      
      // First try to get data directly from Appwrite
      try {
        console.log("Fetching serve attempts directly from Appwrite...");
        const appwriteServes = await appwrite.getServeAttempts();
        console.log("Appwrite serve attempts:", appwriteServes);
        
        if (appwriteServes && appwriteServes.length > 0) {
          // The getServeAttempts function should already normalize the data
          const validatedServes = validateServes(appwriteServes);
          
          // Add client names from clients array
          const enhancedServes = addClientNamesToServes(validatedServes, clients);
          
          // Sort serves by timestamp (newest first)
          const sortedServes = sortServesByDate(enhancedServes);
          setLocalServes(sortedServes);
          
          // Also update local storage for offline use
          localStorage.setItem("serve-tracker-serves", JSON.stringify(sortedServes));
          console.log("Updated local storage with Appwrite data");
          
          setIsSyncing(false);
          return;
        }
      } catch (appwriteError) {
        console.error("Error fetching from Appwrite directly:", appwriteError);
      }
      
      // If Appwrite direct fetch fails, try local storage
      console.log("Falling back to local storage...");
      let serveAttempts = JSON.parse(localStorage.getItem("serve-tracker-serves") || "[]");
      console.log("Serve attempts from local storage:", serveAttempts);

      // Sync with Appwrite if local storage is empty
      if (!serveAttempts || serveAttempts.length === 0) {
        console.warn("No serve attempts found in local storage. Syncing with Appwrite...");
        const synced = await appwrite.syncAppwriteServesToLocal();
        if (synced) {
          serveAttempts = JSON.parse(localStorage.getItem("serve-tracker-serves") || "[]");
          console.log("Serve attempts after syncing with Appwrite:", serveAttempts);
        }
      }

      // Validate and filter the serve attempts
      const validatedServes = validateServes(serveAttempts);
      
      // Enhance with client names
      const enhancedServes = addClientNamesToServes(validatedServes, clients);
      
      // Sort by timestamp (newest first)
      const sortedServes = sortServesByDate(enhancedServes);
      setLocalServes(sortedServes);
    } catch (error) {
      console.error("Error fetching serve history:", error);
      toast({
        title: "Error",
        description: "Failed to load serve history.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Check if the sync function exists before calling it
      if (typeof appwrite.syncAppwriteServesToLocal === 'function') {
        const synced = await appwrite.syncAppwriteServesToLocal();
        
        if (synced) {
          // After syncing, reload data from local storage
          const serveAttempts = JSON.parse(localStorage.getItem("serve-tracker-serves") || "[]");
          const validatedServes = validateServes(serveAttempts);
          setLocalServes(validatedServes);
          
          toast({
            title: "History Refreshed",
            description: "Serve history has been updated with the latest data."
          });
        } else {
          toast({
            title: "Refresh Failed",
            description: "Could not refresh serve history. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        console.warn("syncAppwriteServesToLocal function not found, falling back to manual refresh");
        // Fallback to a manual window refresh
        window.location.reload();
      }
    } catch (error) {
      console.error("Error refreshing history:", error);
      toast({
        title: "Error",
        description: "An error occurred while refreshing serve history.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRepairData = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      toast({
        title: "Repairing Serve Data",
        description: "Attempting to fix any data issues...",
      });

      const result = await repairServeAttempts();
      
      toast({
        title: "Repair Complete",
        description: result.message,
        variant: result.fixed > 0 ? "default" : "warning"
      });

      // Refresh data
      await handleRefresh();
    } catch (error) {
      console.error("Error repairing data:", error);
      toast({
        title: "Repair Failed",
        description: "Could not repair serve data. See console for details.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const fixUnknownClientIds = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      console.log("Fixing serve attempts with unknown client IDs...");
      
      toast({
        title: "Fixing Client IDs",
        description: "Attempting to fix unknown client IDs...",
      });
      
      if (clients.length === 0) {
        toast({
          title: "No Clients Found",
          description: "No clients available to fix serve attempts",
          variant: "destructive"
        });
        return;
      }

      // Get all serve attempts from Appwrite
      const serveAttempts = await appwrite.getServeAttempts();
      console.log(`Found ${serveAttempts.length} serve attempts to check`);
      
      let fixedCount = 0;
      for (const serve of serveAttempts) {
        if (!serve.client_id || serve.client_id === "unknown") {
          console.log(`Fixing serve attempt ${serve.$id} with unknown client ID`);
          
          // Use the first client as a default
          const defaultClientId = clients[0].id;
          
          try {
            await appwrite.databases.updateDocument(
              appwrite.DATABASE_ID,
              appwrite.SERVE_ATTEMPTS_COLLECTION_ID,
              serve.$id,
              { client_id: defaultClientId }
            );
            
            fixedCount++;
          } catch (error) {
            console.error(`Failed to fix serve attempt ${serve.$id}:`, error);
          }
        }
      }
      
      if (fixedCount > 0) {
        toast({
          title: "Fixed Serve Attempts",
          description: `Fixed ${fixedCount} serve attempts with unknown client IDs`,
          variant: "default"
        });
        
        // Refresh the data
        await handleRefresh();
      } else {
        toast({
          title: "No Fixes Needed",
          description: "No serve attempts with unknown client IDs found",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fixing unknown client IDs:", error);
      toast({
        title: "Fix Failed",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditServe = (serve: ServeAttemptData) => {
    setSelectedServe(serve);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteServe(id);
      if (success) {
        toast({
          title: "Success",
          description: "Serve attempt has been deleted",
          variant: "default"
        });
        
        // Update local serves after deletion
        setLocalServes(prev => prev.filter(serve => serve.id !== id));
      } else {
        throw new Error("Failed to delete serve attempt");
      }
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error",
        description: "Failed to delete serve attempt",
        variant: "destructive"
      });
    }
  };

  const validateServes = (serves: ServeAttemptData[]): ServeAttemptData[] => {
    console.log("Validating serve attempts:", serves);
    if (!serves || !Array.isArray(serves)) {
      console.warn("No valid serves array provided");
      return [];
    }

    // Normalize the data to ensure consistency
    const normalizedServes = normalizeServeDataArray(serves);

    const uniqueServes = new Map();
    normalizedServes.forEach((serve) => {
      if (!serve.id) {
        console.warn("Serve attempt missing ID:", serve);
        return;
      }

      if (uniqueServes.has(serve.id)) {
        console.warn(`Duplicate serve detected: ${serve.id}`);
        return;
      }

      uniqueServes.set(serve.id, serve);
    });

    const validated = Array.from(uniqueServes.values());
    console.log("Validated serve attempts after filtering:", validated);
    return validated;
  };

  // Direct fetch from Appwrite if no serves are loaded yet
  useEffect(() => {
    if (localServes.length === 0 && !isSyncing) {
      console.log("No serves found in local state, fetching directly from Appwrite");
      handleRefresh();
    }
  }, [localServes.length, isSyncing]);

  console.log("Serves to display:", localServes);

  return (
    <div className="page-container">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Serve History</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-muted-foreground">
          View your serve history and outcomes
        </p>
      </div>

      {localServes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <HistoryIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No serve history yet</h3>
          <p className="mb-6 text-muted-foreground">
            Create your first serve attempt to see your history here
          </p>
          <Button onClick={() => window.location.href = "/new-serve"}>
            Create Serve Attempt
          </Button>
        </div>
      ) : (
        <ServeHistory 
          serves={localServes} 
          clients={clients} 
          onDelete={handleDelete}
          onEdit={handleEditServe} 
        />
      )}

      {selectedServe && (
        <EditServeDialog
          serve={selectedServe}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={updateServe}
        />
      )}
    </div>
  );
};

export default History;
