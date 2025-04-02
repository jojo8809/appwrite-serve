import { Resend } from 'resend';

export default async ({ req, res, log, error }) => {
  log('Processing email request...');

  try {
    // Parse the request payload
    const payload = req.bodyJson || {};
    const { to, subject, html, text } = payload;

    if (!to || !subject || (!html && !text)) {
      return res.json({ success: false, message: 'Missing required fields (to, subject, and either html or text)' }, 400);
    }

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.json({ success: false, message: 'Resend API key is missing' }, 500);
    }

    const resend = new Resend(resendApiKey);

    // Send the email
    const response = await resend.emails.send({
      from: 'no-reply@justlegalsolutions.tech',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    log('Email sent successfully:', response);
    return res.json({ success: true, message: 'Email sent successfully', data: response });
  } catch (err) {
    error('Error sending email:', err.message);
    return res.json({ success: false, message: `Error: ${err.message}` }, 500);
  }
};
