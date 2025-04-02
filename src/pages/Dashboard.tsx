
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  File,
  Users,
  FileText,
  AlertCircle,
  Briefcase,
  Calendar,
  MapPin,
  Clock
} from "lucide-react";
import { ServeAttemptData } from "@/components/ServeAttempt";
import { ClientData } from "@/components/ClientForm";
import { appwrite } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ACTIVE_BACKEND, BACKEND_PROVIDER } from '@/config/backendConfig';
import * as appwriteStorage from '@/utils/appwriteStorage';
import EditServeDialog from "@/components/EditServeDialog";

interface DashboardProps {
  clients: ClientData[];
  serves: ServeAttemptData[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, serves }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editServeDialogOpen, setEditServeDialogOpen] = useState(false);
  const [selectedServe, setSelectedServe] = useState<ServeAttemptData | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof ClientData>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof ClientData) => {
    if (column === sortColumn) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    const columnA = a[sortColumn] || '';
    const columnB = b[sortColumn] || '';

    if (typeof columnA === 'string' && typeof columnB === 'string') {
      const comparison = columnA.localeCompare(columnB);
      return sortOrder === 'asc' ? comparison : -comparison;
    } else if (typeof columnA === 'number' && typeof columnB === 'number') {
      return sortOrder === 'asc' ? columnA - columnB : columnB - columnA;
    }

    return 0;
  });

  const filteredClients = sortedClients.filter(client => {
    const searchTerm = searchQuery.toLowerCase();
    // Remove the status check since ClientData doesn't have a status property
    return (
      (client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        client.phone.toLowerCase().includes(searchTerm) ||
        client.address.toLowerCase().includes(searchTerm))
    );
  });

  const handleDeleteClientButton = (clientId: string) => {
    setDeleteClientId(clientId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    
    try {
      // Delete the client
      const success = await appwrite.deleteClient(deleteClientId);
      
      if (success) {
        toast({
          title: "Client deleted",
          description: "Client and associated data have been removed",
          variant: "success",
        });
      } else {
        toast({
          title: "Error deleting client",
          description: "There was a problem deleting the client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: "Error deleting client",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteClientId(null);
    }
  };

  const handleEditServe = (serve: ServeAttemptData) => {
    setSelectedServe(serve);
    setEditServeDialogOpen(true);
  };

  const handleDeleteServe = async (serveId: string) => {
    try {
      await appwrite.deleteServeAttempt(serveId);
      toast({
        title: "Serve deleted",
        description: "Service attempt has been removed",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting serve attempt:", error);
      toast({
        title: "Error deleting serve attempt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const updateServeAttempt = async (updatedServe: ServeAttemptData): Promise<boolean> => {
    try {
      // Update the serve attempt in the database
      await appwrite.updateServeAttempt(updatedServe.id, updatedServe);
      
      // No setServes defined in the component, so we don't update local state here
      
      // Update the case status if needed
      if (updatedServe.status === "completed" && updatedServe.clientId && updatedServe.caseNumber) {
        await appwriteStorage.updateCaseStatus(updatedServe.clientId, updatedServe.caseNumber);
      }
      
      toast({
        title: "Serve attempt updated",
        description: "The serve attempt has been updated successfully",
        variant: "success",
      });

      return true;
    } catch (error) {
      console.error("Error updating serve attempt:", error);
      toast({
        title: "Failed to update serve attempt",
        description: "There was a problem updating the serve attempt",
        variant: "destructive",
      });
      return false;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Overview</CardTitle>
          <CardDescription>
            Quick overview of your client and serve data.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center space-x-4 rounded-md border p-3 transition-colors hover:border-primary">
            <Users className="h-9 w-9 text-gray-500" />
            <div className="space-y-1">
              <p className="text-2xl font-semibold">{clients.length}</p>
              <p className="text-sm text-muted-foreground">Total Clients</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 rounded-md border p-3 transition-colors hover:border-primary">
            <FileText className="h-9 w-9 text-gray-500" />
            <div className="space-y-1">
              <p className="text-2xl font-semibold">{serves.length}</p>
              <p className="text-sm text-muted-foreground">Total Serve Attempts</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 rounded-md border p-3 transition-colors hover:border-primary">
            <File className="h-9 w-9 text-gray-500" />
            <div className="space-y-1">
              <p className="text-2xl font-semibold">TBD</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            Manage and view your clients.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Input
                type="search"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
              
              <Button onClick={() => navigate('/clients')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
            
            <ScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                      Name
                      {sortColumn === 'name' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('email')} className="cursor-pointer">
                      Email
                      {sortColumn === 'email' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableHead>
                    <TableHead onClick={() => handleSort('phone')} className="cursor-pointer">
                      Phone
                      {sortColumn === 'phone' && (sortOrder === 'asc' ? ' ▲' : ' ▼')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/clients?edit=${client.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClientButton(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Serve Attempts</CardTitle>
          <CardDescription>
            View and manage recent serve attempts.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Case</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serves.slice(0, 5).map((serve) => {
                  const client = clients.find(c => c.id === serve.clientId);
                  const clientName = client ? client.name : "Unknown Client";
                  const dateTime = serve.timestamp ? new Date(serve.timestamp).toLocaleString() : "Unknown";
                  
                  return (
                    <TableRow key={serve.id}>
                      <TableCell>{clientName}</TableCell>
                      <TableCell>{serve.caseNumber || "N/A"}</TableCell>
                      <TableCell>{dateTime}</TableCell>
                      <TableCell>{serve.status}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditServe(serve)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteServe(serve.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          <Button variant="link" className="mt-4" onClick={() => navigate('/history')}>
            View All Serve Attempts
          </Button>
        </CardContent>
      </Card>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteClientId(null);
              setDeleteDialogOpen(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {selectedServe && (
        <EditServeDialog
          serve={selectedServe}
          open={editServeDialogOpen}
          onOpenChange={setEditServeDialogOpen}
          onSave={updateServeAttempt}
        />
      )}
    </div>
  );
};

export default Dashboard;
