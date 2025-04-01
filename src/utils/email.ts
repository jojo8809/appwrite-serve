import { appwrite } from "@/lib/appwrite";

interface EmailProps {
  to: string | string[];
  subject: string;
  body: string;
}

/**
 * Sends an email using the Resend service via Appwrite Cloud Function
 */
export const sendEmail = async (props: EmailProps): Promise<{ success: boolean; message: string }> => {
  const { to, subject, body } = props;

  try {
    const recipients = Array.isArray(to) ? [...to] : [to];
    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
    }

    const functionId = '67ec44660011c13116cd';
    const payload = { 
      to: recipients, 
      subject, 
      body,
      apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA"
    };

    console.log("Sending email with payload:", payload);

    const response = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify(payload)
    );

    console.log("Appwrite function response:", response);

    if (!response || response.response === undefined) {
      console.error("Empty or invalid response from Appwrite function:", response);
      return { success: false, message: "Empty or invalid response from email function." };
    }

    const result = JSON.parse(response.response);
    if (result.success) {
      console.log("Email sent successfully:", result.message);
      return { success: true, message: result.message };
    } else {
      console.error("Failed to send email:", result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error("Error calling resend-email function:", error);
    return { success: false, message: "Failed to send email." };
  }
};

/**
 * Resends an email using Appwrite Cloud Function
 */
export const resendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
  try {
    // Add the business email
    const recipients = Array.isArray(to) ? [...to] : [to];
    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
    }
    
    // Use the same function ID as in sendEmail
    const functionId = '67ec44660011c13116cd'; // Corrected function ID
    
    const response = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify({ 
        to: recipients, 
        subject, 
        body,
        apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA" // Include API key in payload
      })
    );
    
    // Check if response exists and has a response property
    if (!response || response.response === undefined) {
      console.error("Empty or invalid response from Appwrite function:", response);
      return false;
    }

    // Try to parse the response, handle invalid JSON
    let result;
    try {
      result = JSON.parse(response.response);
    } catch (parseError) {
      console.error("Failed to parse function response:", response.response);
      return false;
    }
    
    if (result.success) {
      console.log("Email resent successfully:", result.message);
      return true;
    } else {
      console.error("Failed to resend email:", result.message);
      return false;
    }
  } catch (error) {
    console.error("Error calling resend-email function:", error);
    return false;
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
