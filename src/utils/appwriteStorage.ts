import { appwrite } from "@/lib/appwrite";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";

export interface UploadedDocument {
  id: string;
  clientId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  caseNumber?: string;
  description?: string;
  caseName?: string;
}

export async function uploadClientDocument(
  clientId: string,
  file: File,
  caseNumber?: string,
  description?: string
): Promise<UploadedDocument | null> {
  try {
    const result = await appwrite.uploadClientDocument(clientId, file, caseNumber, description);
    
    if (!result) {
      toast({
        title: "Error uploading document",
        description: "Document could not be uploaded. Please try again."
      });
      return null;
    }
    
    toast({
      title: "Document uploaded",
      description: "Document has been successfully uploaded."
    });
    
    return result;
  } catch (error) {
    console.error("Unexpected error uploading document:", error);
    toast({
      title: "Error uploading document",
      description: "An unexpected error occurred. Please try again."
    });
    return null;
  }
}

export async function getClientDocuments(clientId: string, caseNumber?: string): Promise<UploadedDocument[]> {
  try {
    return await appwrite.getClientDocuments(clientId, caseNumber);
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return [];
  }
}

export async function getDocumentUrl(filePath: string): Promise<string | null> {
  try {
    return await appwrite.getDocumentUrl(filePath);
  } catch (error) {
    console.error("Error getting document URL:", error);
    return null;
  }
}

export async function deleteClientDocument(id: string, filePath: string): Promise<boolean> {
  try {
    const result = await appwrite.deleteClientDocument(id, filePath);
    
    if (result) {
      toast({
        title: "Document deleted",
        description: "Document has been permanently removed."
      });
    } else {
      toast({
        title: "Error deleting document",
        description: "Document could not be deleted. Please try again."
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error deleting document:", error);
    toast({
      title: "Error deleting document",
      description: "An unexpected error occurred. Please try again."
    });
    return false;
  }
}

export async function getClientCases(clientId: string): Promise<{ caseNumber: string; caseName?: string }[]> {
  try {
    const cases = await appwrite.getClientCases(clientId);
    return cases
      .filter(c => c.status !== 'Closed') // Exclude Closed cases
      .map(c => ({
        caseNumber: c.caseNumber,
        caseName: c.caseName
      }));
  } catch (error) {
    console.error("Error fetching client cases:", error);
    return [];
  }
}

export async function getServeAttemptsCount(clientId: string, caseNumber: string): Promise<number> {
  try {
    console.log(`Checking serve attempts for client ${clientId} and case ${caseNumber}`);
    
    try {
      // Use the Query API from Appwrite to filter serve attempts
      const serveAttempts = await appwrite.getServeAttempts();
      const filteredAttempts = serveAttempts.filter(
        serve => serve.clientId === clientId && serve.caseNumber === caseNumber
      );
      
      console.log(`Found ${filteredAttempts.length} attempts for client ${clientId} and case ${caseNumber}`);
      return filteredAttempts.length;
    } catch (e) {
      console.log("Appwrite query failed, using local storage instead");
    }
    
    // Fallback to local storage
    const serveAttemptsStr = localStorage.getItem("serve-tracker-serves");
    if (!serveAttemptsStr) return 0;
    
    const serveAttempts = JSON.parse(serveAttemptsStr);
    const caseAttempts = serveAttempts.filter(
      (serve: any) => serve.clientId === clientId && serve.caseNumber === caseNumber
    );
    
    console.log(`Found ${caseAttempts.length} attempts in local storage for client ${clientId} and case ${caseNumber}`);
    return caseAttempts.length;
  } catch (error) {
    console.error("Error counting serve attempts:", error);
    return 0;
  }
}

export async function updateCaseStatus(clientId: string, caseNumber: string, serveStatus: string): Promise<boolean> {
  try {
    let newStatus = 'Pending';
    
    // If served successfully, mark as Closed
    if (serveStatus === 'Served' || serveStatus === 'completed') {
      newStatus = 'Closed';
    } 
    // If failed attempt, keep as Pending
    else if (serveStatus === 'Failed' || serveStatus === 'failed') {
      newStatus = 'Pending';
    }
    
    console.log(`Updating case status for client ${clientId}, case ${caseNumber} to ${newStatus}`);
    
    return await appwrite.updateCaseStatus(clientId, caseNumber, newStatus);
  } catch (error) {
    console.error("Unexpected error updating case status:", error);
    return false;
  }
}

export async function exportServeData(startDate?: Date, endDate?: Date): Promise<{ 
  success: boolean; 
  data?: string; 
  error?: string;
}> {
  try {
    // Set default date range if not provided
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days back
    
    console.log(`Exporting serve data from ${start.toISOString()} to ${end.toISOString()}`);
    
    // Get all serve attempts from Appwrite
    let serveData = [];
    try {
      const allServes = await appwrite.getServeAttempts();
      
      // Filter by date range
      serveData = allServes.filter((serve: any) => {
        const serveDate = new Date(serve.timestamp);
        return serveDate >= start && serveDate <= end;
      });
      
      // For each serve, get the client info
      const clients = await appwrite.getClients();
      
      serveData = serveData.map((serve: any) => {
        const client = clients.find((c: any) => c.$id === serve.clientId) || {};
        return {
          ...serve,
          client
        };
      });
      
      console.log(`Found ${serveData.length} serve attempts in Appwrite`);
    } catch (e) {
      console.log("Error fetching from Appwrite, using local storage for serve data export");
      
      // Fall back to local storage
      const serveAttemptsStr = localStorage.getItem("serve-tracker-serves");
      if (!serveAttemptsStr) {
        return { success: false, error: "No serve data found" };
      }
      
      const allServes = JSON.parse(serveAttemptsStr);
      
      // Filter by date
      serveData = allServes.filter((serve: any) => {
        const serveDate = new Date(serve.timestamp);
        return serveDate >= start && serveDate <= end;
      });
      
      // For each serve, get the client info
      const clientsStr = localStorage.getItem("serve-tracker-clients");
      const clients = clientsStr ? JSON.parse(clientsStr) : [];
      
      serveData = serveData.map((serve: any) => {
        const client = clients.find((c: any) => c.id === serve.clientId) || {};
        return {
          ...serve,
          client
        };
      });
    }
    
    if (serveData.length === 0) {
      return { success: false, error: "No serve data found in the specified date range" };
    }
    
    // Generate CSV header
    const csvHeader = [
      'Date', 
      'Time', 
      'Client Name', 
      'Client Address', 
      'Case Number', 
      'Status', 
      'Notes', 
      'GPS Coordinates', 
      'Attempt #'
    ].join(',') + '\n';
    
    // Generate CSV rows
    const csvRows = serveData.map((serve: any) => {
      const date = new Date(serve.timestamp);
      const clientName = (serve.client.name || serve.client?.name) || 'Unknown';
      const clientAddress = (serve.client.address || serve.client?.address) || 'Unknown';
      
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        `"${clientName.replace(/"/g, '""')}"`,
        `"${clientAddress.replace(/"/g, '""')}"`,
        `"${(serve.caseNumber || '').replace(/"/g, '""')}"`,
        `"${(serve.status || '').replace(/"/g, '""')}"`,
        `"${(serve.notes || '').replace(/"/g, '""')}"`,
        serve.coordinates ? `"${serve.coordinates.latitude},${serve.coordinates.longitude}"` : '',
        serve.attemptNumber || 1
      ].join(',');
    }).join('\n');
    
    // Combine header and rows
    const csv = csvHeader + csvRows;
    
    return { 
      success: true, 
      data: csv 
    };
  } catch (error) {
    console.error("Error exporting serve data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error exporting data" 
    };
  }
}
