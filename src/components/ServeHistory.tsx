import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ServeAttemptData } from "./ServeAttempt";
import { ClientData } from "./ClientForm";
// Replace Supabase import with Appwrite
import { appwrite } from "@/lib/appwrite";
import { 
  MapPin, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  User,
  CalendarClock,
  FileText
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface ServeHistoryProps {
  serves: ServeAttemptData[];
  clients: ClientData[];
  onEdit?: (serve: ServeAttemptData) => void;
  onDelete?: (id: string) => void;
}

export default function ServeHistory({ serves, clients, onEdit, onDelete }: ServeHistoryProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Unknown Client";
  };
  
  const formatDate = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      console.error("Date formatting error:", error, date);
      return "Unknown date";
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      // Use Appwrite instead of supabase
      await appwrite.deleteServeAttempt(deleteId);
      
      toast({
        title: "Serve attempt deleted",
        description: "The serve attempt has been permanently removed",
        variant: "default"
      });
      
      // Call onDelete if provided
      if (onDelete) {
        onDelete(deleteId);
      }
      
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error deleting serve attempt",
        description: "An error occurred while deleting the serve attempt",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = (serveId: string) => {
    setDeleteId(serveId);
  };
  
  if (!serves || serves.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No serve history found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {serves.map((serve) => (
        <Card key={serve.id} className="neo-card overflow-hidden animate-scale-in">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getClientName(serve.clientId)}</span>
                  <Badge variant={serve.status === "completed" ? "success" : "warning"}>
                    {serve.status === "completed" ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Served</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Failed Attempt</>
                    )}
                  </Badge>
                </div>
                
                {serve.caseNumber && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Case #{serve.caseNumber}</span>
                    {serve.attemptNumber && (
                      <span className="text-xs bg-accent px-1.5 py-0.5 rounded">
                        Attempt #{serve.attemptNumber}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>{formatDate(serve.timestamp)}</span>
                </div>
                
                {serve.coordinates && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>
                      {serve.coordinates.latitude.toFixed(6)}, {serve.coordinates.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
                
                {serve.notes && (
                  <div className="mt-2 text-sm">
                    <p className="text-muted-foreground line-clamp-2">{serve.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 sm:flex-col mt-3 sm:mt-0">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial flex items-center"
                    onClick={() => onEdit(serve)}
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                )}
                
                <AlertDialog open={deleteId === serve.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 sm:flex-initial flex items-center text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(serve.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Serve Attempt</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this serve attempt? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteId(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
