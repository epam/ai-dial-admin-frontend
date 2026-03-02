export const CHAT_COMPLETION_BODY = {
  messages: [{ role: 'user', content: '${{user_message}}' }],
  temperature: '${{temperature:0.7}}',
};
