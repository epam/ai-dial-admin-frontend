import { DialFeatures } from '@/src/models/dial/features';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

export const modelsTextFeatures: (keyof DialFeatures)[] = [
  'rateEndpoint',
  'tokenizeEndpoint',
  'truncatePromptEndpoint',
  'configurationEndpoint',
];

export const applicationTextFeatures: (keyof DialFeatures)[] = [...modelsTextFeatures];

export const placeholdersMap: Record<string, EntityPlaceholdersI18nKey> = {
  rateEndpoint: EntityPlaceholdersI18nKey.RateEndpoint,
  tokenizeEndpoint: EntityPlaceholdersI18nKey.TokenizeEndpoint,
  truncatePromptEndpoint: EntityPlaceholdersI18nKey.TruncatePromptEndpoint,
  configurationEndpoint: EntityPlaceholdersI18nKey.ConfigurationEndpoint,
};

export const runnerApplicationMap: Record<string, string> = {
  rateEndpoint: 'dial:applicationTypeRateEndpoint',
  tokenizeEndpoint: 'dial:applicationTypeTokenizeEndpoint',
  truncatePromptEndpoint: 'dial:applicationTypeTruncatePromptEndpoint',
  configurationEndpoint: 'dial:applicationTypeConfigurationEndpoint',
  assistantAttachmentsInRequestSupported: 'dial:applicationTypeAssistantAttachmentsInRequestSupported',
};

export const modelsSwitchFeatures: (keyof DialFeatures)[] = [
  'systemPromptSupported',
  'toolsSupported',
  'temperatureSupported',
  'seedSupported',
  'urlAttachmentsSupported',
  'folderAttachmentsSupported',
  'assistantAttachmentsInRequestSupported',
  'accessibleByPerRequestKey',
  'contentPartsSupported',
  'cacheSupported',
  'autoCachingSupported',
  'parallelToolCallsSupported',
  'supportCommentInRateResponse',
];

export const applicationSwitchFeatures: (keyof DialFeatures)[] = [
  'systemPromptSupported',
  'toolsSupported',
  'seedSupported',
  'urlAttachmentsSupported',
  'folderAttachmentsSupported',
  'assistantAttachmentsInRequestSupported',
  'accessibleByPerRequestKey',
  'contentPartsSupported',
  'consentRequired',
  'supportCommentInRateResponse',
];
