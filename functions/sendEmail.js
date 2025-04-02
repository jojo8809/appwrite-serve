import { Resend } from 'resend';

export default async ({ req, res, log, error }) => {
  log('Processing email request...');

  try {
    // Parse the request payload
    const payload = req.bodyJson || {};
    log('Request payload:', JSON.stringify(payload));
    
    const { to, subject, html, text } = payload;

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

    // Normalize recipients to array format
    const recipients = Array.isArray(to) ? to : [to];
    log('Sending email to recipients:', recipients);
    log('Email subject:', subject);

    const resend = new Resend(resendApiKey);

    // Send the email
    const response = await resend.emails.send({
      from: 'notifications@justlegalsolutions.tech',
      to: recipients,
      subject,
      html: html || undefined,
      text: text || undefined,
    });

    log('Email sent successfully:', JSON.stringify(response));
    return res.json({ 
      success: true, 
      message: 'Email sent successfully', 
      data: response,
      recipients
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
