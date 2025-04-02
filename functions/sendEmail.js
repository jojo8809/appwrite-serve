import { Resend } from 'resend';
import { Client, Databases } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  log('Processing email request...');

  try {
    // Parse the request payload
    const payload = req.bodyJson || {};
    log('Request payload keys:', Object.keys(payload));
    
    const { to, subject, html, text, serveId, imageFormat = 'jpeg' } = payload;

    if (!to || !subject || (!html && !text)) {
      error('Missing required fields');
      return res.json({ 
        success: false, 
        message: 'Missing required fields (to, subject, and either html or text)',
        received: { 
          to: to ? (Array.isArray(to) ? to.length + ' recipients' : 'single recipient') : 'missing', 
          subject: subject ? 'provided' : 'missing',
          html: html ? 'provided' : 'missing',
          text: text ? 'provided' : 'missing' 
        }
      }, 400);
    }

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      error('Resend API key is missing in environment variables');
      return res.json({ success: false, message: 'Resend API key is missing' }, 500);
    }

    const resend = new Resend(resendApiKey);

    // Initialize Appwrite client for fetching the image_data
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

    // Fetch the serve attempt document to get the image_data
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
            filename: `serve_evidence.${imageFormat}`,
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
    } else {
      log('No serve ID provided, skipping image attachment');
    }

    log('Sending email with final configuration:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: emailData.attachments.length > 0,
      attachmentCount: emailData.attachments.length
    });

    // Send the email
    const response = await resend.emails.send(emailData);

    log('Email sent successfully:', JSON.stringify(response));
    return res.json({ 
      success: true, 
      message: 'Email sent successfully', 
      data: response,
      recipients: emailData.to,
      includedImage: emailData.attachments.length > 0
    });
  } catch (err) {
    error('Error sending email:', err.message);
    error('Error details:', err.stack || 'No stack trace available');
    return res.json({ 
      success: false, 
      message: `Error: ${err.message}`,
      details: err.stack || 'No stack trace available'
    }, 500);
  }
};
