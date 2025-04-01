import { appwrite } from "@/lib/appwrite";

interface EmailProps {
  to: string | string[];
  subject: string;
  body: string;
  imageData?: string;
  coordinates?: { lat: number; lng: number };
}

/**
 * Sends an email using Appwrite Functions
 */
export const sendEmail = async (props: EmailProps): Promise<{ success: boolean; message: string }> => {
  let { to, subject, body, imageData, coordinates } = props;
  
  // Convert 'to' to array format if it's a string
  const recipients = Array.isArray(to) ? [...to] : [to];
  
  // Always include the business email if it's not already in the recipients list
  const businessEmail = "info@justlegalsolutions.org";
  if (!recipients.includes(businessEmail)) {
    recipients.push(businessEmail);
  }
  
  console.log("Sending email:", { to: recipients, subject });
  console.log("Email body:", body);
  console.log("Email lengths - subject:", subject?.length, "body:", body?.length);
  console.log(`Recipients (${recipients.length}):`, recipients);
  
  // Check if image data is present
  if (imageData) {
    console.log("Image data present, length:", imageData.length);
  } else {
    console.log("No image data provided");
  }
  
  // Check if Appwrite is properly configured
  if (!appwrite.isAppwriteConfigured()) {
    console.error("Appwrite is not configured. Email sending will fail.");
    return {
      success: false,
      message: "Appwrite is not configured. Cannot send email."
    };
  }
  
  try {
    console.log("Preparing to call Appwrite Function for email");
    
    // Validate email format for each recipient
    for (const email of recipients) {
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        console.error("Invalid recipient email address", email);
        return {
          success: false,
          message: `Invalid recipient email address: ${email}`
        };
      }
    }
    
    return await appwrite.sendEmail({
      to: recipients,
      subject,
      body,
      imageData,
      coordinates
    });
  } catch (error) {
    console.error(`Exception in email sending:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error sending email"
    };
  }
};

/**
 * Creates a formatted email body for a serve attempt
 */
export const createServeEmailBody = (
  clientName: string,
  address: string,
  notes: string,
  timestamp: Date,
  coords: GeolocationCoordinates,
  attemptNumber: number,
  caseNumber?: string
): string => {
  const googleMapsUrl = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
  
  return `
Process Serve Attempt #${attemptNumber}

Client: ${clientName}
Address: ${address}
${caseNumber ? `Case Number: ${caseNumber}\n` : ''}
Date: ${timestamp.toLocaleString()}
GPS Coordinates: ${coords.latitude}, ${coords.longitude}
Location Link: ${googleMapsUrl}

Notes:
${notes}

---
This is an automated message from ServeTracker.
  `;
};

/**
 * Creates a notification email for serve attempt deletion
 */
export const createDeleteNotificationEmail = (
  clientName: string,
  caseNumber: string,
  serveDate: Date,
  deleteReason?: string
): string => {
  return `
Serve Attempt Deleted

Client: ${clientName}
Case: ${caseNumber}
Original Serve Date: ${serveDate.toLocaleString()}
${deleteReason ? `\nReason for deletion: ${deleteReason}\n` : ''}

This serve attempt has been permanently removed from the system.

---
This is an automated message from ServeTracker.
  `;
};

/**
 * Creates a notification email for serve attempt updates
 */
export const createUpdateNotificationEmail = (
  clientName: string,
  caseNumber: string,
  serveDate: Date,
  oldStatus: string,
  newStatus: string,
  notes?: string
): string => {
  return `
Serve Attempt Updated

Client: ${clientName}
Case: ${caseNumber}
Serve Date: ${serveDate.toLocaleString()}
Status: Changed from "${oldStatus}" to "${newStatus}"
${notes ? `\nNotes: ${notes}\n` : ''}

---
This is an automated message from ServeTracker.
  `;
};
