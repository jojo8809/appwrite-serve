import { appwrite } from "@/lib/appwrite";
import { v4 as uuidv4 } from "uuid";

// Make sure to export the type properly with 'export type'
export type UploadedDocument = {
  id: string;
  clientId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  caseNumber?: string;
  description?: string;
  caseName?: string;
};

export async function uploadClientDocument(
  clientId: string,
  file: File,
  caseNumber?: string,
  description?: string
): Promise<UploadedDocument | null> {
  try {
    const document = await appwrite.uploadClientDocument(clientId, file, caseNumber, description);
    
    if (!document) {
      throw new Error("Failed to upload document");
    }
    
    return {
      id: document.$id,
      clientId: document.client_id,
      fileName: document.file_name,
      filePath: document.file_path,
      fileType: document.file_type,
      fileSize: document.file_size,
      caseNumber: document.case_number,
      description: document.description,
      // Note: caseName is populated client-side
      caseName: undefined
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
      clientId: doc.client_id,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileType: doc.file_type,
      fileSize: doc.file_size,
      caseNumber: doc.case_number,
      description: doc.description,
      caseName: undefined // We don't have this in the document
    }));
  } catch (error) {
    console.error("Error fetching documents:", error);
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
    console.error("Error deleting document:", error);
    return false;
  }
}

export async function getClientCases(clientId: string): Promise<{ caseNumber: string; caseName?: string }[]> {
  try {
    const cases = await appwrite.getClientCases(clientId);
    return cases.map(caseItem => ({
      caseNumber: caseItem.case_number,
      caseName: caseItem.case_name
    }));
  } catch (error) {
    console.error("Error fetching client cases:", error);
    return [];
  }
}

export async function getServeAttemptsCount(clientId: string, caseNumber: string): Promise<number> {
  try {
    const serveAttempts = await appwrite.getClientServeAttempts(clientId);
    return serveAttempts.filter(serve => serve.case_number === caseNumber).length;
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
    // Implementation depends on your export logic
    return { success: true, data: "Exported data" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
