import { appwrite } from "@/lib/appwrite";

interface EmailProps {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  text?: string;
}

/**
 * Sends an email using the Resend service via Appwrite Cloud Function
 */
export const sendEmail = async (props: EmailProps): Promise<{ success: boolean; message: string }> => {
  const { to, subject, body, html, text } = props;

  try {
    // Check if we have valid recipients
    if (!to || (Array.isArray(to) && to.length === 0)) {
      console.error("No recipients specified for email");
      return { success: false, message: "No email recipients specified" };
    }

    // Format recipients as array if not already
    const recipients = Array.isArray(to) ? to : [to];
    console.log("Sending email to recipients:", recipients);
    console.log("Email subject:", subject);
    console.log("Email body length:", body?.length || 0);

    const functionId = import.meta.env.VITE_APPWRITE_EMAIL_FUNCTION_ID;
    console.log("Using Appwrite function ID:", functionId);
    
    if (!functionId) {
      console.error("Email function ID not configured in environment variables");
      return { success: false, message: "Email function ID not configured" };
    }

    // Prepare payload with all required fields
    const payload = JSON.stringify({ 
      to: recipients, 
      subject, 
      html: html || body,
      text: text || body.replace(/<[^>]*>/g, '')  // Fallback plain text by stripping HTML
    });

    console.log("Executing Appwrite function with ID:", functionId);
    console.log("Email payload size:", payload.length, "bytes");

    try {
      // Execute the Appwrite function
      const response = await appwrite.functions.createExecution(
        functionId,
        payload
      );

      console.log("Function execution response:", {
        status: response.status,
        response: response.response ? JSON.parse(response.response) : null,
        logs: response.stdout || "No logs available"
      });
      
      if (response.status === "completed") {
        try {
          const responseData = JSON.parse(response.response || "{}");
          
          if (responseData.success === false) {
            console.error("Email function returned success=false:", responseData.message);
            return { success: false, message: responseData.message || "Unknown error in function response" };
          }
          
          console.log("Email sent successfully to:", recipients);
          return { success: true, message: "Email sent successfully" };
        } catch (parseError) {
          console.warn("Could not parse function response:", parseError);
          return { success: true, message: "Email sent (response parsing error)" };
        }
      }

      console.error("Function execution failed:", response.stderr || "No error details");
      return { 
        success: false, 
        message: `Email function failed: ${response.status}, error: ${response.stderr || "No details"}` 
      };
    } catch (functionError) {
      console.error("Error executing Appwrite function:", functionError);
      return { success: false, message: `Function execution error: ${functionError.message}` };
    }
  } catch (error) {
    console.error("General error in email sending:", error);
    return { success: false, message: `Email delivery failed: ${error.message}` };
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
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Process Serve Attempt</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    h1 { color: #2c3e50; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .detail { margin-bottom: 10px; }
    .label { font-weight: bold; }
    .notes { background-color: #f9f9f9; padding: 10px; border-left: 4px solid #ddd; }
    .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
    a { color: #3498db; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Process Serve Attempt #${attemptNumber}</h1>
    
    <div class="detail">
      <span class="label">Client:</span> ${clientName}
    </div>
    
    <div class="detail">
      <span class="label">Address:</span> ${address}
    </div>
    
    ${caseNumber ? `
    <div class="detail">
      <span class="label">Case Number:</span> ${caseNumber}
    </div>
    ` : ""}
    
    <div class="detail">
      <span class="label">Date:</span> ${timestamp.toLocaleString()}
    </div>
    
    <div class="detail">
      <span class="label">GPS Coordinates:</span> ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}
    </div>
    
    <div class="detail">
      <span class="label">Location Link:</span> <a href="${googleMapsUrl}" target="_blank">${googleMapsUrl}</a>
    </div>
    
    <div class="detail">
      <span class="label">Notes:</span>
      <div class="notes">${notes || "No additional notes"}</div>
    </div>
    
    <div class="footer">
      This is an automated message from ServeTracker.
    </div>
  </div>
</body>
</html>
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
