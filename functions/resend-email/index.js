const { Resend } = require("resend");

module.exports = async function(req, res) {
  console.log("Function execution started...");
  console.log("Request object keys:", Object.keys(req));
  
  try {
    let payload;
    
    // Extract payload
    if (req.payload === undefined) {
      console.log("Payload is undefined, looking for alternatives");
      if (req.body) {
        payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } else if (req.method === 'POST' && typeof req.rawBody === 'string') {
        payload = JSON.parse(req.rawBody);
      } else {
        console.log("Using hardcoded test values for console testing");
        payload = {
          to: "iannazzi.joseph@gmail.com",
          subject: "Test Email from Console",
          body: "<p>This is a test email sent from the Appwrite console.</p>"
        };
      }
    } else {
      payload = typeof req.payload === 'string' ? JSON.parse(req.payload) : req.payload;
    }
    
    console.log("Final payload:", payload);
    
    const { to, subject, body, apiKey } = payload || {};
    const resendApiKey = (req.variables && req.variables.RESEND_API_KEY) || apiKey || "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA";
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is missing.");
      res.json({ success: false, message: "API key is missing." });
      return;
    }
    
    if (!to || !subject || !body) {
      console.error("Missing required fields in payload.");
      res.json({ success: false, message: "Missing required fields (to, subject, or body)." });
      return;
    }

    const resend = new Resend(resendApiKey);
    console.log("Sending email with the following details:", { from: "ServeTracker <no-reply@justlegalsolutions.tech>", to, subject, bodyLength: body.length });

    const response = await resend.emails.send({
      from: "ServeTracker <no-reply@justlegalsolutions.tech>",
      to,
      subject,
      html: body,
    });

    console.log("Resend API response:", response);

    if (response && response.data && response.data.id) {
      res.json({ success: true, message: "Email sent successfully.", id: response.data.id });
    } else {
      console.error("Resend API returned an unexpected response:", response);
      res.json({ success: false, message: "Failed to send email. Unexpected response from Resend API." });
    }
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    res.json({ success: false, message: "Failed to send email.", error: error.message });
  }
};
