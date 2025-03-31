import api from './api';

/**
 * Sends an email using MongoDB backend
 */
export const sendEmail = async (emailData) => {
  try {
    const response = await api.post('/email/send', emailData);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Error sending email'
    };
  }
};
