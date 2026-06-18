import { EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { DialFeatures } from '@/src/models/dial/features';
import { MultiValueOption } from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';

export enum ReasoningEffort {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export const REASONING_EFFORTS_OPTIONS: MultiValueOption[] = [
  { label: ReasoningEffort.Low, value: ReasoningEffort.Low },
  { label: ReasoningEffort.Medium, value: ReasoningEffort.Medium },
  { label: ReasoningEffort.High, value: ReasoningEffort.High },
];
import { SwitchFeatureGroup } from './models';

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

export const modelsSwitchGroups: SwitchFeatureGroup[] = [
  {
    title: FeaturesI18nKey.GroupSamplingOutputControl,
    keys: [
      'temperatureSupported',
      'customTemperatureSupported',
      'seedSupported',
      'maxTokensSupported',
      'maxCompletionTokensSupported',
    ],
  },
  {
    title: FeaturesI18nKey.GroupToolsFunctionCalling,
    keys: ['toolsSupported', 'parallelToolCallsSupported'],
  },
  {
    title: FeaturesI18nKey.GroupPromptMessageComposition,
    keys: ['systemPromptSupported', 'contentPartsSupported'],
  },
  {
    title: FeaturesI18nKey.GroupAttachments,
    keys: ['urlAttachmentsSupported', 'folderAttachmentsSupported', 'assistantAttachmentsInRequestSupported'],
  },
  {
    title: FeaturesI18nKey.GroupCaching,
    keys: ['cacheSupported', 'autoCachingSupported'],
  },
  {
    title: FeaturesI18nKey.GroupSessionAccess,
    keys: ['allowResume', 'accessibleByPerRequestKey'],
  },
  {
    title: FeaturesI18nKey.GroupFeedback,
    keys: ['supportCommentInRateResponse'],
  },
];

export const applicationSwitchGroups: SwitchFeatureGroup[] = [
  {
    title: FeaturesI18nKey.GroupSamplingOutputControl,
    keys: [
      'temperatureSupported',
      'customTemperatureSupported',
      'seedSupported',
      'maxTokensSupported',
      'maxCompletionTokensSupported',
    ],
  },
  {
    title: FeaturesI18nKey.GroupToolsFunctionCalling,
    keys: ['toolsSupported', 'parallelToolCallsSupported'],
  },
  {
    title: FeaturesI18nKey.GroupPromptMessageComposition,
    keys: ['systemPromptSupported', 'contentPartsSupported'],
  },
  {
    title: FeaturesI18nKey.GroupAttachments,
    keys: ['urlAttachmentsSupported', 'folderAttachmentsSupported', 'assistantAttachmentsInRequestSupported'],
  },
  {
    title: FeaturesI18nKey.GroupSessionAccess,
    keys: ['allowResume', 'accessibleByPerRequestKey', 'consentRequired'],
  },
  {
    title: FeaturesI18nKey.GroupFeedback,
    keys: ['supportCommentInRateResponse'],
  },
];

export const modelsSwitchFeatures: (keyof DialFeatures)[] = modelsSwitchGroups.flatMap((g) => g.keys);

export const applicationSwitchFeatures: (keyof DialFeatures)[] = applicationSwitchGroups.flatMap((g) => g.keys);
