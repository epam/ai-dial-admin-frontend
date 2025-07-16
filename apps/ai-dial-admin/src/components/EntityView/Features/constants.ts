import { DialFeatures } from '@/src/models/dial/base-entity';

export const modelsTextFeatures: (keyof DialFeatures)[] = [
  'rateEndpoint',
  'tokenizeEndpoint',
  'truncatePromptEndpoint',
];

export const applicationTextFeatures: (keyof DialFeatures)[] = [...modelsTextFeatures, 'configurationEndpoint'];

export const modelsSwitchFeatures: (keyof DialFeatures)[] = [
  'systemPromptSupported',
  'toolsSupported',
  'seedSupported',
  'urlAttachmentsSupported',
  'folderAttachmentsSupported',
  'accessibleByPerRequestKey',
  'contentPartsSupported',
  'cacheSupported',
  'autoCachingSupported',
  'parallelToolCallsSupported',
];

export const applicationSwitchFeatures: (keyof DialFeatures)[] = [
  'systemPromptSupported',
  'toolsSupported',
  'seedSupported',
  'urlAttachmentsSupported',
  'folderAttachmentsSupported',
  'accessibleByPerRequestKey',
  'contentPartsSupported',
  // concent required
];
