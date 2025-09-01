import { DialFeatures } from '@/src/models/dial/features';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

export const modelsTextFeatures: (keyof DialFeatures)[] = [
  'rateEndpoint',
  'tokenizeEndpoint',
  'truncatePromptEndpoint',
];

export const applicationTextFeatures: (keyof DialFeatures)[] = [...modelsTextFeatures, 'configurationEndpoint'];

export const placeholdersMap: Record<string, EntityPlaceholdersI18nKey> = {
  rateEndpoint: EntityPlaceholdersI18nKey.RateEndpoint,
  tokenizeEndpoint: EntityPlaceholdersI18nKey.TokenizeEndpoint,
  truncatePromptEndpoint: EntityPlaceholdersI18nKey.TruncatePromptEndpoint,
  configurationEndpoint: EntityPlaceholdersI18nKey.ConfigurationEndpoint,
};

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
  'consentRequired',
];
