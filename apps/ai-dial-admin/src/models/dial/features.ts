export interface DialFeatures {
  truncatePromptEndpoint: string;
  rateEndpoint: string;
  configurationEndpoint: string;
  tokenizeEndpoint: string;
  toolsSupported: boolean;
  systemPromptSupported: boolean;
  urlAttachmentsSupported: boolean;
  folderAttachmentsSupported: boolean;
  assistantAttachmentsInRequestSupported: boolean;
  seedSupported: boolean;
  allowResume: boolean;
  addonsSupported: boolean;
  temperatureSupported: boolean;
  customTemperatureSupported: boolean;
  maxTokensSupported: boolean;
  maxCompletionTokensSupported: boolean;
  accessibleByPerRequestKey: boolean;
  parallelToolCallsSupported: boolean;
  contentPartsSupported: boolean;
  cacheSupported: boolean;
  autoCachingSupported: boolean;
  consentRequired: boolean;
  supportCommentInRateResponse: boolean;
  reasoningEfforts?: string[];
}
