import axios from 'axios';

export const sendSlackNotification = async (token: string, channel: string, message: string) => {
  try {
    // We send a message to a channel or user if they connected Slack
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channel || 'general', // Default fallback
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Failed to send Slack notification', error);
  }
};
