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
    console.log("Sending email via Appwrite function:", { to, subject });

    const functionId = import.meta.env.VITE_APPWRITE_EMAIL_FUNCTION_ID;
    if (!functionId) {
      throw new Error("Appwrite email function ID is not configured");
    }

    const response = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify({ to, subject, html: html || body, text })
    );

    if (response.status === "completed") {
      console.log("Email sent successfully via Appwrite function");
      return { success: true, message: "Email sent successfully" };
    }

    throw new Error(`Function execution failed with status: ${response.status}`);
  } catch (error) {
    console.error("Error sending email:", error);
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
