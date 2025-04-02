const { Resend } = require("resend");

// Appwrite functions return directly, not using res.json()
module.exports = async function(req) {
  console.log("Function execution started...");
  
  try {
    let payload;
    
    // Extract payload
    if (req.payload) {
      payload = typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload;
    } else if (req.body) {
      payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      return { success: false, message: "No payload provided" };
    }
    
    console.log("Payload received in function:", payload);
    
    const { to, subject, body, imageData, apiKey } = payload || {};
    // Ensure we have a valid API key - if not provided in payload, try environment variable
    const resendApiKey = (req.variables && req.variables.RESEND_API_KEY) || apiKey || "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA";
    
    console.log("Using Resend API key (first 6 chars):", resendApiKey.substring(0, 6) + "...");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing.");
      return { success: false, message: "API key is missing." };
    }
    
    if (!to || !subject || !body) {
      console.error("Missing required fields in payload.");
      return { success: false, message: "Missing required fields (to, subject, or body)." };
    }

    const resend = new Resend(resendApiKey);
    const recipients = Array.isArray(to) ? to : [to];

    const attachments = [];
    if (imageData) {
      // Handle both formats of Base64 data (with or without the data:image prefix)
      try {
        const base64Content = imageData.includes('base64,') 
          ? imageData.split('base64,')[1] 
          : imageData;
        
        attachments.push({
          filename: "serve-photo.jpg",
          content: base64Content,
          encoding: "base64",
        });
        console.log("Added image attachment");
      } catch (attachErr) {
        console.error("Error processing image attachment:", attachErr);
      }
    }

    console.log("Sending email to:", recipients);
    console.log("Email subject:", subject);

    try {
      const emailData = {
        from: "ServeTracker <no-reply@justlegalsolutions.tech>",
        to: recipients,
        subject,
        html: body,
        attachments: attachments.length > 0 ? attachments : undefined,
      };
      
      console.log("Final email payload:", {
        ...emailData,
        html: emailData.html ? "HTML content" : undefined,
        attachments: emailData.attachments ? `${emailData.attachments.length} attachments` : undefined
      });
      
      const response = await resend.emails.send(emailData);

      console.log("Resend API raw response:", JSON.stringify(response));

      if (response && response.data && response.data.id) {
        console.log("Email sent successfully with ID:", response.data.id);
        return { success: true, message: "Email sent successfully.", id: response.data.id };
      } else {
        console.error("Resend API returned an unexpected response:", response);
        return { 
          success: false, 
          message: "Failed to send email. Unexpected response from Resend API."
        };
      }
    } catch (error) {
      console.error("Error sending email via Resend:", error);
      if (error.response) {
        console.error("Resend API error details:", error.response);
      }
      return { 
        success: false, 
        message: `Failed to send email: ${error.message}`
      };
    }
  } catch (error) {
    console.error("Error in Resend function:", error);
    return { 
      success: false, 
      message: `Failed to send email: ${error.message}` 
    };
  }
};
