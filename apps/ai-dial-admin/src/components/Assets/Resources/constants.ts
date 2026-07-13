import { EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { DialApplicationResourceFeatures } from '@/src/models/dial/resource';

export interface ResourceSwitchFeatureGroup {
  title: FeaturesI18nKey;
  keys: (keyof DialApplicationResourceFeatures)[];
}

export const resourceTextFeatures: (keyof DialApplicationResourceFeatures)[] = [
  'rate_endpoint',
  'tokenize_endpoint',
  'truncate_prompt_endpoint',
  'configuration_endpoint',
];

export const resourceSwitchGroups: ResourceSwitchFeatureGroup[] = [
  {
    title: FeaturesI18nKey.GroupSamplingOutputControl,
    keys: [
      'temperature_supported',
      'custom_temperature_supported',
      'seed_supported',
      'max_tokens_supported',
      'max_completion_tokens_supported',
    ],
  },
  {
    title: FeaturesI18nKey.GroupToolsFunctionCalling,
    keys: ['tools_supported', 'parallel_tool_calls_supported'],
  },
  {
    title: FeaturesI18nKey.GroupPromptMessageComposition,
    keys: ['system_prompt_supported', 'content_parts_supported'],
  },
  {
    title: FeaturesI18nKey.GroupAttachments,
    keys: ['url_attachments_supported', 'folder_attachments_supported', 'assistant_attachments_in_request_supported'],
  },
  {
    title: FeaturesI18nKey.GroupSessionAccess,
    keys: ['allow_resume', 'accessible_by_per_request_key', 'consent_required'],
  },
  {
    title: FeaturesI18nKey.GroupFeedback,
    keys: ['support_comment_in_rate_response'],
  },
];

export const resourceFeatureLabelMap: Record<keyof DialApplicationResourceFeatures, FeaturesI18nKey> = {
  rate_endpoint: FeaturesI18nKey.rateEndpoint,
  tokenize_endpoint: FeaturesI18nKey.tokenizeEndpoint,
  truncate_prompt_endpoint: FeaturesI18nKey.truncatePromptEndpoint,
  configuration_endpoint: FeaturesI18nKey.configurationEndpoint,
  system_prompt_supported: FeaturesI18nKey.systemPromptSupported,
  tools_supported: FeaturesI18nKey.toolsSupported,
  seed_supported: FeaturesI18nKey.seedSupported,
  url_attachments_supported: FeaturesI18nKey.urlAttachmentsSupported,
  folder_attachments_supported: FeaturesI18nKey.folderAttachmentsSupported,
  allow_resume: FeaturesI18nKey.allowResume,
  accessible_by_per_request_key: FeaturesI18nKey.accessibleByPerRequestKey,
  content_parts_supported: FeaturesI18nKey.contentPartsSupported,
  temperature_supported: FeaturesI18nKey.temperatureSupported,
  consent_required: FeaturesI18nKey.consentRequired,
  parallel_tool_calls_supported: FeaturesI18nKey.parallelToolCallsSupported,
  assistant_attachments_in_request_supported: FeaturesI18nKey.assistantAttachmentsInRequestSupported,
  support_comment_in_rate_response: FeaturesI18nKey.supportCommentInRateResponse,
  max_tokens_supported: FeaturesI18nKey.maxTokensSupported,
  max_completion_tokens_supported: FeaturesI18nKey.maxCompletionTokensSupported,
  custom_temperature_supported: FeaturesI18nKey.customTemperatureSupported,
  reasoning_efforts: FeaturesI18nKey.reasoningEfforts,
};

export const resourceFeaturePlaceholderMap: Record<string, EntityPlaceholdersI18nKey> = {
  rate_endpoint: EntityPlaceholdersI18nKey.RateEndpoint,
  tokenize_endpoint: EntityPlaceholdersI18nKey.TokenizeEndpoint,
  truncate_prompt_endpoint: EntityPlaceholdersI18nKey.TruncatePromptEndpoint,
  configuration_endpoint: EntityPlaceholdersI18nKey.ConfigurationEndpoint,
};
