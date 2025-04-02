import { Resend } from 'resend';
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Processing email request...');

  try {
    // Parse the request payload
    const payload = req.bodyJson || {};
    const { to, subject, html, text, serveId } = payload;

    if (!to || !subject || (!html && !text)) {
      error('Missing required fields');
      return res.json({ success: false, message: 'Missing required fields' }, 400);
    }

    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Initialize Appwrite client
    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

    const databases = new Databases(appwriteClient);

    // Prepare email data
    const emailData = {
      from: 'notifications@justlegalsolutions.tech',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || undefined,
      text: text || undefined,
      attachments: []
    };

    // Fetch the `image_data` from Appwrite if `serveId` is provided
    if (serveId) {
      log(`Fetching serve attempt with ID: ${serveId}`);
      try {
        const serve = await databases.getDocument(
          process.env.APPWRITE_FUNCTION_DATABASE_ID,
          process.env.APPWRITE_FUNCTION_SERVE_ATTEMPTS_COLLECTION_ID,
          serveId
        );

        if (serve.image_data) {
          log('Found image_data in serve attempt document');
          emailData.attachments.push({
            filename: 'serve_evidence.jpeg',
            content: serve.image_data.split('base64,')[1], // Extract base64 content
            encoding: 'base64'
          });
          log('Image successfully attached to email');
        } else {
          log('No image_data found in serve attempt document');
        }
      } catch (fetchError) {
        error('Failed to fetch serve attempt document:', fetchError.message);
        return res.json({ success: false, message: 'Failed to fetch serve attempt document' }, 500);
      }
    }

    log('Sending email with final configuration:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: emailData.attachments.length > 0
    });

    // Send the email
    const response = await resend.emails.send(emailData);

    log('Email sent successfully:', JSON.stringify(response));
    return res.json({ success: true, message: 'Email sent successfully', data: response });
  } catch (err) {
    error('Error sending email:', err.message);
    return res.json({ success: false, message: `Error: ${err.message}` }, 500);
  }
};
