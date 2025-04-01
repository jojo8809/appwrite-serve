import React, { useState, useEffect } from "react";
import ServeHistory from "@/components/ServeHistory";
import { ClientData } from "@/components/ClientForm";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EditServeDialog from "@/components/EditServeDialog";
import { appwrite } from "@/lib/appwrite";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedServe, setSelectedServe] = useState<ServeAttemptData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      const synced = await appwrite.syncAppwriteServesToLocal();
      
      if (synced) {
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
    } catch (error) {
      console.error("Error refreshing history:", error);
      toast({
        title: "Error",
        description: "An error occurred while refreshing serve history.",
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

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Serve History</h1>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-muted-foreground">
          View your serve history and outcomes
        </p>
      </div>

      {serves.length === 0 ? (
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
          serves={serves} 
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
}

export default History;
