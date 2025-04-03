
import { ServeAttemptData } from "@/components/ServeAttempt";
import { appwrite } from "@/lib/appwrite";

// Base email interface
export interface EmailData {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  imageData?: string; // Base64 encoded image data
  imageFormat?: string; // Format of the image (jpeg, png, etc.)
}

// Create an email for serve attempt notifications
export const createServeEmailBody = (
  clientName: string,
  address: string,
  notes: string,
  timestamp: Date,
  coordinates: { latitude: number; longitude: number } | null,
  attemptNumber: number,
  caseNumber: string
): string => {
  const googleMapsLink = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
    : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">New Serve Attempt Recorded</h2>
      
      <p><strong>Case:</strong> ${caseNumber}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      <p><strong>Attempt #:</strong> ${attemptNumber}</p>
      <p><strong>Location:</strong> ${address}</p>
      ${googleMapsLink ? `<p><a href="${googleMapsLink}" target="_blank">View on Google Maps</a></p>` : ''}
      
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #4f46e5;">Notes:</h3>
        <p style="white-space: pre-line;">${notes || "No notes provided"}</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Create an email for serve attempt updates
export const createUpdateNotificationEmail = (
  clientName: string,
  caseNumber: string,
  timestamp: Date,
  oldStatus: string,
  newStatus: string,
  notes: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4f46e5; margin-bottom: 20px;">Serve Attempt Updated</h2>
      
      <p><strong>Case:</strong> ${caseNumber}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      <p><strong>Status Change:</strong> ${oldStatus} → ${newStatus}</p>
      
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #4f46e5;">Updated Notes:</h3>
        <p style="white-space: pre-line;">${notes || "No notes provided"}</p>
      </div>
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Create an email for serve attempt deletions
export const createDeleteNotificationEmail = (
  clientName: string,
  caseNumber: string,
  timestamp: Date,
  reason?: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #e53e3e; margin-bottom: 20px;">Serve Attempt Deleted</h2>
      
      <p><strong>Case:</strong> ${caseNumber}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Original Date/Time:</strong> ${timestamp.toLocaleString()}</p>
      
      ${reason ? `
      <div style="margin-top: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <h3 style="margin-top: 0; color: #e53e3e;">Reason:</h3>
        <p>${reason}</p>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 12px;">
        This is an automated notification from JLS Process Server Pro.
      </p>
    </div>
  `;
};

// Constants for Appwrite messaging
const PROVIDER_ID = "67ee09ff00384f10d275";
const TOPIC_ID = "67edfd2d000a20397825";

// Function to send email through Appwrite messaging
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Sending message via Appwrite:", {
      to: emailData.to,
      subject: emailData.subject,
      hasImage: !!emailData.imageData
    });

    // Create metadata object
    const metadata: any = { 
      hasImage: !!emailData.imageData,
      hasCoordinates: emailData.body.includes("View on Google Maps"),
      timestamp: new Date().toISOString()
    };
    
    // Add image length if available
    if (emailData.imageData) {
      metadata.imageLength = emailData.imageData.length;
    }
    
    // Add coordinates if available
    if (metadata.hasCoordinates) {
      metadata.coordinates = emailData.body.match(/https:\/\/www\.google\.com\/maps\?q=([^"]+)/)?.[1] || null;
    }

    // Format recipients for proper representation in message
    let recipients: string[] = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    
    // Ensure we have email addresses
    if (recipients.length === 0) {
      throw new Error("No recipients specified for email");
    }
    
    // Add the business email if not already in the list
    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
    }

    // Convert the recipients to a string for the message
    const recipientsString = recipients.join(", ");

    // Create message payload
    const messagePayload = {
      subject: emailData.subject,
      content: emailData.html || emailData.body,
      recipients: recipientsString,
      imageData: emailData.imageData || null,
      metadata: JSON.stringify(metadata)
    };

    // Send the message using Appwrite messaging
    const response = await appwrite.sendMessage(messagePayload, PROVIDER_ID, TOPIC_ID);
    
    if (!response) {
      throw new Error("Failed to send message through Appwrite");
    }

    console.log("Message sent successfully:", response);
    return { success: true, message: 'Message sent successfully' };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error sending message' 
    };
  }
}
