export const modelMock = {
  name: 'ai21.j2-grande-instruct',
  endpoint: 'http://bedrock.dial-development/openai/deployments/ai21.j2-grande-instruct/chat/completions',
  displayName: 'AI21 Jurassic-2-updated-2-1-3-4-5',
  displayVersion: 'Grande',
  iconUrl: 'ai21_j2.svg',
  description:
    'J2-Grande-Instruct is a model designed specifically for generating text based on minimal context.\n\nIt is highly accurate and can be fine-tuned to power smart chatbots and other conversational interfaces. It is part of the Jurassic-2 (J2) series of Large Language Models developed by AI21 Labs',
  forwardAuthToken: false,
  defaults: {},
  interceptors: [],
  topics: ['Text Generation', 'Continue Supported'],
  /*roleLimits: {
    default: {
      minute: '64000',
      day: '1000000',
      week: '9223372036854775807',
      month: '9223372036854775807',
      requestHour: '9223372036854775807',
      requestDay: '9223372036854775807',
    },
    'research-team': {
      minute: '6400000',
      day: '100000000',
      week: '9223372036854775807',
      month: '9223372036854775807',
      requestHour: '9223372036854775807',
      requestDay: '9223372036854775807',
    },
  },
  maxRetryAttempts: 5,
  type: 'chat',
  limits: {
    maxTotalTokens: 8191,
  },
  pricing: {
    unit: 'token',
    prompt: '0.0000125',
    completion: '0.0000125',
  },
  upstreams: [
    {
      weight: 1,
      tier: 0,
    },
  ],*/
};

export const adaptersMock = [
  { name: 'OpenAI', baseEndpoint: 'http://openai.dial-development.svc.cluster.local/openai/deployments/' },
  { name: 'Bedrock', baseEndpoint: 'http://bedrock.dial-development/openai/deployments/' },
  { name: 'Vertex AI', baseEndpoint: 'http://vertex.dial-development/openai/deployments/' },
];
