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
    // Convert 'to' to array if it's a string
    const recipients = Array.isArray(to) ? [...to] : [to];
    
    // Add the business email if not already included
    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
      console.log(`Added business email ${businessEmail} to recipients`);
    }

    // Function ID from your Appwrite dashboard
    const functionId = '67ec44660011c13116cd'; // Corrected function ID
    console.log(`Using function ID: ${functionId}`);

    // Create the payload
    const payload = { 
      to: recipients, 
      subject, 
      body,
      apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA" // Include API key in payload
    };
    
    console.log("Sending execution with payload:", JSON.stringify(payload, null, 2));

    // Execute the function
    const response = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify(payload)
    );

    console.log("Raw Appwrite response:", JSON.stringify(response, null, 2));

    // Check if response exists
    if (!response) {
      console.error("Empty response from Appwrite function");
      return { success: false, message: "Empty response from email function." };
    }

    // Check if response has the expected structure
    if (typeof response !== 'object' || response.response === undefined) {
      console.error("Invalid response format from Appwrite function:", response);
      
      // If the execution was created but there's no proper response, check the status
      if (response.status) {
        console.log("Function execution status:", response.status);
        return { 
          success: false, 
          message: `Email function executed with status: ${response.status}. Check Appwrite logs for details.` 
        };
      }
      
      return { success: false, message: "Invalid response format from email function." };
    }

    // Try to parse the response, handle invalid JSON
    let result;
    try {
      result = JSON.parse(response.response);
      console.log("Parsed response:", result);
    } catch (parseError) {
      console.error("Failed to parse function response:", response.response);
      
      // If we can't parse but have a string response, return it as the message
      if (typeof response.response === 'string') {
        return { 
          success: false, 
          message: `Invalid response format: ${response.response.substring(0, 100)}...` 
        };
      }
      
      return { success: false, message: "Invalid response format from email function." };
    }

    // Handle the parsed result
    if (result && result.success) {
      console.log("Email sent successfully:", result.message);
      return { success: true, message: result.message || "Email sent successfully" };
    } else if (result) {
      console.error("Function returned error:", result.message || "Unknown error");
      return { success: false, message: result.message || "Function returned an error" };
    } else {
      console.error("Unknown function response format");
      return { success: false, message: "Unknown function response format" };
    }
  } catch (error) {
    console.error("Error calling resend-email function:", error);
    return { 
      success: false, 
      message: error instanceof Error ? `Failed to send email: ${error.message}` : "Failed to send email." 
    };
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
