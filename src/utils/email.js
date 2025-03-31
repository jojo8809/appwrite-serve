 import api from '../services/api';

/**
 * Sends an email using our MongoDB backend service
 */
export const sendEmail = async (props) => {
  const { to, subject, body, imageData, coordinates } = props;
  
  console.log("Sending email:", { to, subject });
  
  try {
    // Validate email format
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      console.error("Invalid recipient email address", to);
      return {
        success: false,
        message: `Invalid recipient email address: ${to}`
      };
    }
    
    // Prepare image data for transmission
    const processedImageData = imageData ? imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') : undefined;
    
    const response = await api.post('/email/send', {
      to,
      subject,
      body,
      imageData: processedImageData,
      coordinates
    });
    
    return response.data;
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send email"
    };
  }
};
