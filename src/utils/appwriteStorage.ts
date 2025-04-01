import { appwrite } from "@/lib/appwrite";
import { v4 as uuidv4 } from "uuid";

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
    
    return {
      id: result.id,
      clientId: result.clientId,
      fileName: result.fileName,
      filePath: result.filePath,
      fileType: result.fileType,
      fileSize: result.fileSize,
      caseNumber: result.caseNumber,
      description: result.description,
      caseName: result.caseName
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return null;
  }
}

export async function getClientDocuments(clientId: string, caseNumber?: string): Promise<UploadedDocument[]> {
  try {
    const documents = await appwrite.getClientDocuments(clientId, caseNumber);
    
    return documents.map(doc => ({
      id: doc.$id,
      clientId: doc.clientId,
      fileName: doc.fileName,
      filePath: doc.filePath,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      caseNumber: doc.caseNumber,
      description: doc.description || "",
      caseName: doc.caseName || ""
    }));
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
    return await appwrite.deleteClientDocument(id, filePath);
  } catch (error) {
    console.error("Error deleting client document:", error);
    return false;
  }
}

export async function getClientCases(clientId: string): Promise<{ caseNumber: string; caseName?: string }[]> {
  try {
    const cases = await appwrite.getClientCases(clientId);
    
    return cases.map(caseItem => ({
      caseNumber: caseItem.caseNumber,
      caseName: caseItem.caseName
    }));
  } catch (error) {
    console.error("Error fetching client cases:", error);
    return [];
  }
}

export async function getServeAttemptsCount(clientId: string, caseNumber: string): Promise<number> {
  try {
    const serveAttempts = await appwrite.getClientServeAttempts(clientId);
    return serveAttempts.filter(serve => serve.caseNumber === caseNumber).length;
  } catch (error) {
    console.error("Error counting serve attempts:", error);
    return 0;
  }
}

export async function updateCaseStatus(caseId: string, status: string): Promise<boolean> {
  try {
    await appwrite.updateCaseStatus(caseId, status);
    return true;
  } catch (error) {
    console.error("Error updating case status:", error);
    return false;
  }
}

export async function exportServeData(startDate: Date, endDate: Date): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    // Get all serve attempts
    const serveAttempts = await appwrite.getServeAttempts();
    
    // Filter by date range
    const filteredServes = serveAttempts.filter(serve => {
      const serveDate = new Date(serve.date);
      return serveDate >= startDate && serveDate <= endDate;
    });
    
    // Create CSV content
    const headers = ["Date", "Time", "Client", "Address", "Status", "Notes", "Case Number"];
    let csvContent = headers.join(",") + "\n";
    
    for (const serve of filteredServes) {
      // Get client name
      const client = await appwrite.databases.getDocument(
        appwrite.DATABASE_ID,
        appwrite.CLIENTS_COLLECTION_ID,
        serve.clientId
      );
      
      const row = [
        `"${serve.date}"`,
        `"${serve.time}"`,
        `"${client.name}"`,
        `"${serve.address || ''}"`,
        `"${serve.status}"`,
        `"${serve.notes?.replace(/"/g, '""') || ''}"`,
        `"${serve.caseNumber || ''}"`
      ];
      
      csvContent += row.join(",") + "\n";
    }
    
    return {
      success: true,
      data: csvContent
    };
  } catch (error) {
    console.error("Error exporting serve data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error exporting data"
    };
  }
}
