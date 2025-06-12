import { Client, Account, Databases, Storage, ID, Query, Teams, Functions } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/backendConfig';
import { createServeEmailBody } from "@/utils/email"; 

const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const functions = new Functions(client);

const DATABASE_ID = APPWRITE_CONFIG.databaseId;
const CLIENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clients;
const SERVE_ATTEMPTS_COLLECTION_ID = APPWRITE_CONFIG.collections.serveAttempts;
// ... other collection IDs

export const appwrite = {
  // --- Other functions (getClients, updateClient, etc.) go here and remain unchanged ---
  client,
  account,
  databases,
  storage,
  teams,
  functions,
  DATABASE_ID,
  collections: APPWRITE_CONFIG.collections,
  CLIENTS_COLLECTION_ID,
  SERVE_ATTEMPTS_COLLECTION_ID,
  // ... other IDs

  async sendEmailViaFunction(emailData) {
    try {
      const businessEmail = 'info@justlegalsolutions.org';
      const recipients = Array.isArray(emailData.to) ? [...emailData.to] : [emailData.to];
      if (!recipients.some(email => email.toLowerCase() === businessEmail.toLowerCase())) {
        recipients.push(businessEmail);
      }

      const response = await functions.createExecution(
        "67ed8899003a8b119a18", // Your function ID
        JSON.stringify({ ...emailData, to: recipients })
      );

      if (response.status === "completed") {
        console.log("Email function executed successfully:", response);
        const responseBody = JSON.parse(response.responseBody);
        if (responseBody.success) {
            return { success: true, message: "Email sent successfully" };
        } else {
            console.error("Email function reported failure:", responseBody.message);
            return { success: false, message: responseBody.message || "Email function execution reported an error" };
        }
      } else {
        console.error("Email function execution failed:", response);
        return { success: false, message: response.errors || "Email function execution failed" };
      }
    } catch (error) {
      console.error("Error calling email function:", error);
      return { success: false, message: error.message };
    }
  },
  
  async getServeAttempts() {
    try {
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID);
      return response.documents.map(doc => ({
        ...doc,
        id: doc.$id
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error fetching serve attempts:', error);
      return [];
    }
  },

  // ... other functions ...

  async createServeAttempt(serveData) {
    try {
      const documentId = ID.unique();
      const payload = {
        client_id: serveData.clientId,
        client_name: serveData.clientName || "Unknown Client",
        case_number: serveData.caseNumber || "Not Specified",
        case_name: serveData.caseName || "Unknown Case",
        status: serveData.status || "unknown",
        notes: serveData.notes || "",
        address: serveData.address || "Address not provided",
        coordinates: typeof serveData.coordinates === 'string' ? serveData.coordinates : "0,0",
        image_data: serveData.imageData || "",
        timestamp: new Date().toISOString(),
        attempt_number: serveData.attemptNumber || 1,
      };

      // Step 1: Create the document in the database
      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        documentId,
        payload
      );
      
      console.log("Serve attempt saved successfully with ID:", response.$id);

      // --- THE FIX IS HERE ---
      // We now use the 'response' object from the database, which is guaranteed
      // to have the correct ID and all the saved data.
      
      // Step 2: Prepare the email using the confirmed data from the database response
      const emailBody = createServeEmailBody(
        response.client_name,
        response.address,
        response.notes,
        new Date(response.timestamp),
        response.coordinates,
        response.attempt_number,
        response.case_name
      );

      const emailData = {
        to: serveData.clientEmail || "info@justlegalsolutions.org",
        subject: `New Serve Attempt Created - ${response.case_name}`,
        html: emailBody,
        imageData: response.image_data,
        // We now pass the ID from the successfully created document
        serveId: response.$id 
      };

      // Step 3: Send the email
      console.log("Sending email with confirmed serveId:", response.$id);
      const emailResult = await this.sendEmailViaFunction(emailData);

      if (emailResult.success) {
        console.log("Email sent successfully:", emailResult.message);
      } else {
        console.error("Failed to send email:", emailResult.message);
      }
      
      return response;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      throw error;
    }
  },

  // ... (the rest of the functions in your appwrite.js file)
};
```

---

I have also updated your backend function's code to match this new, correct logic. Please also replace the code in your Appwrite Function.


```javascript
import nodemailer from 'nodemailer';
import process from "node:process";
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
    log('Processing request...');
    try {
        const payload = req.payload
            ? (typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload)
            : (req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : null);

        if (!payload) {
            return res.json({ success: false, message: "No payload provided" });
        }

        const { to, subject, html, text, serveId, imageData, notes } = payload;

        if (!to || !subject || !html) {
            return res.json({ success: false, message: "Missing required fields (to, subject, html)" });
        }

        const appwriteClient = new Client()
            .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
            .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
            .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

        const databases = new Databases(appwriteClient);
        
        // Proactively remove any placeholder map links from the template
        let emailHtml = html.replace(/<a[^>]*href="https?:\/\/www\.google\.com\/maps[^>]*>.*?<\/a>/gi, '');

        const emailData = {
            from: process.env.SMTP_FROM || 'no-reply@example.com',
            to: Array.isArray(to) ? to : [to],
            subject,
            html: emailHtml,
            text,
            attachments: []
        };
        
        let coordinates = null;

        // The serveId is now guaranteed to be correct
        if (serveId) {
            log(`Fetching document with serveId: ${serveId}`);
            try {
                const serve = await databases.getDocument(
                    process.env.APPWRITE_FUNCTION_DATABASE_ID,
                    process.env.APPWRITE_FUNCTION_SERVE_ATTEMPTS_COLLECTION_ID,
                    serveId
                );
                
                if (serve.coordinates) {
                    coordinates = serve.coordinates;
                }
                
                // Use the image from the database record as the source of truth
                if (serve.image_data) {
                    let base64Content = serve.image_data;
                    if (serve.image_data.includes('base64,')) {
                        base64Content = serve.image_data.split('base64,')[1];
                    }
                    emailData.attachments.push({
                        filename: 'serve_evidence.jpeg',
                        content: base64Content,
                        encoding: 'base64'
                    });
                }
            } catch (fetchError) {
                error(`Failed to fetch document: ${fetchError.message}`);
                // If fetching fails, we can still try to send the email without the GPS/image
            }
        } else if (imageData) {
            // Fallback for older method if needed
            let base64Content = imageData;
            if (imageData.includes("base64,")) {
                base64Content = imageData.split("base64,")[1];
            }
            emailData.attachments.push({
                filename: 'serve_evidence.jpeg',
                content: base64Content,
                encoding: 'base64'
            });
        }
        
        let detailsHtml = '';

        if (coordinates || notes) {
            detailsHtml += `<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;"><p><strong>Additional Details:</strong></p>`;
        }
        
        if (coordinates) {
             if (typeof coordinates === 'string' && coordinates.includes(',')) {
                const [lat, lon] = coordinates.split(',').map(s => s.trim());
                if (lat && lon) {
                    detailsHtml += `<p><strong>Serve Attempt Coordinates:</strong> <a href="https://www.google.com/maps?q=${lat},${lon}">${coordinates}</a></p>`;
                }
            }
        }

        if (notes) {
            detailsHtml += `<p><strong>Notes:</strong> ${notes}</p>`;
        }

        if (emailData.html.includes('</body>')) {
            emailData.html = emailData.html.replace('</body>', `${detailsHtml}</body>`);
        } else {
            emailData.html += detailsHtml;
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        await transporter.sendMail(emailData);
        log("Email sent successfully.");
        return res.json({ success: true, message: "Email sent successfully" });

    } catch (err) {
        error(err.message);
        return res.json({ success: false, message: `Error: ${err.message}` }, 500);
    }
};

