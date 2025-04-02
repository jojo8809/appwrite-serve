import { appwrite } from "@/lib/appwrite";

interface EmailProps {
  to: string | string[];
  subject: string;
  body: string;
}

/**
 * Sends an email using the Resend service via Appwrite Cloud Function
 */
export const sendEmail = async (props: EmailProps & { imageData?: string }): Promise<{ success: boolean; message: string }> => {
  const { to, subject, body, imageData } = props;

  try {
    console.log("Preparing to send email with the following details:", { to, subject, bodyLength: body.length });

    let recipients: string[];
    if (Array.isArray(to)) {
      recipients = [...to].filter(email => !!email?.trim());
    } else if (typeof to === "string" && to.trim()) {
      recipients = [to.trim()];
    } else {
      console.error("Invalid recipient format:", to);
      return { success: false, message: "Invalid recipient email format" };
    }

    const businessEmail = "info@justlegalsolutions.org";
    if (!recipients.includes(businessEmail)) {
      recipients.push(businessEmail);
    }

    console.log("Final recipients list:", recipients);

    const functionId = "67ec44660011c13116cd";
    const functionResponse = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify({ to: recipients, subject, body, imageData }),
      false
    );

    console.log("Function response:", functionResponse);

    if (functionResponse.status === "completed") {
      return { success: true, message: "Email sent successfully via Appwrite function" };
    }

    throw new Error(`Function execution failed with status: ${functionResponse.status}`);
  } catch (error) {
    console.error("Error in email sending:", error);
    return { success: false, message: `Email delivery failed: ${error.message}` };
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
    const functionId = '67ec44660011c13116cd';
    
    const response = await appwrite.functions.createExecution(
      functionId,
      JSON.stringify({ 
        to: recipients, 
        subject, 
        body,
        apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA"
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
