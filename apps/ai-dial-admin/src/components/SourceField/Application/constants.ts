import { EntitiesI18nKey } from '@/src/constants/i18n';
import { RadioButtonWithContent, SelectOption } from '@epam/ai-dial-ui-kit';

export enum SourceType {
  ENDPOINTS = 'endpoints',
  APP_RUNNER = 'app_runner',
}

export const ApplicationSourceTypes = (t: (stringToTranslate: string) => string): RadioButtonWithContent[] => [
  { id: SourceType.ENDPOINTS, name: t(EntitiesI18nKey.EndpointsSourceType) },
  { id: SourceType.APP_RUNNER, name: t(EntitiesI18nKey.AppRunner) },
];

export const TRANSPORTS: SelectOption[] = [{ label: 'HTTP', value: 'http' }];
