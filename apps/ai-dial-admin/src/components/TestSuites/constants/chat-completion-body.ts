export const CHAT_COMPLETION_BODY = {
  messages: [{ role: 'user', content: '${{user_message}}' }],
  model: "${{model:''}}",
  temperature: '${{temperature:0.7}}',
};
