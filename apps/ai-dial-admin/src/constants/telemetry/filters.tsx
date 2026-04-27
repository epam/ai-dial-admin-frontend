import Contains from '@/public/images/icons/filter/contains.svg';
import EndsWith from '@/public/images/icons/filter/ends-with.svg';
import NotContains from '@/public/images/icons/filter/not-contains.svg';
import StartsWith from '@/public/images/icons/filter/starts-with.svg';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { FILTER_OPERATOR, FILTER_TYPE } from '@/src/types/telemetry';
import { IconEqual, IconEqualNot } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

export const refreshOptionsConfig = [
  { value: 'off', label: 'Off', timeout: null },
  { value: '30s', label: '30s', timeout: 30 * 1000 },
  { value: '1m', label: '1m', timeout: 60 * 1000 },
  { value: '5m', label: '5m', timeout: 5 * 60 * 1000 },
  { value: '15m', label: '15m', timeout: 15 * 60 * 1000 },
  { value: '30m', label: '30m', timeout: 30 * 60 * 1000 },
  { value: '1h', label: '1h', timeout: 60 * 60 * 1000 },
  { value: '2h', label: '2h', timeout: 2 * 60 * 60 * 1000 },
  { value: '1d', label: '1d', timeout: 24 * 60 * 60 * 1000 },
];

export const filterOperatorConfig: Record<string, string> = {
  [FILTER_OPERATOR.Contain]: '$contains',
  [FILTER_OPERATOR.NotContains]: '$not_contains',
  [FILTER_OPERATOR.Equal]: '$eq',
  [FILTER_OPERATOR.NotEqual]: '$ne',
  [FILTER_OPERATOR.StartsWith]: '$starts_with',
  [FILTER_OPERATOR.EndsWith]: '$ends_with',
};

export const filterTypeConfig = [
  { value: FILTER_TYPE.Entity, label: TelemetryI18nKey.FilterTypeEntities, filter: 'deployment' },
  { value: FILTER_TYPE.Project, label: TelemetryI18nKey.FilterTypeProjects, filter: 'project_id' },
];

export const mcpFilterTypeConfig = [
  { value: FILTER_TYPE.Mcp, label: TelemetryI18nKey.FilterTypeMcp, filter: 'deployment' },
  { value: FILTER_TYPE.Project, label: TelemetryI18nKey.FilterTypeProjects, filter: 'project_id' },
];

export const filterConditionConfig = [
  { value: FILTER_OPERATOR.Contain, label: TelemetryI18nKey.FilterConditionContain, icon: <Contains /> },
  { value: FILTER_OPERATOR.NotContains, label: TelemetryI18nKey.FilterConditionNotContain, icon: <NotContains /> },
  {
    value: FILTER_OPERATOR.Equal,
    label: TelemetryI18nKey.FilterConditionEqual,
    icon: <IconEqual {...BASE_BUTTON_ICON_PROPS} />,
  },
  {
    value: FILTER_OPERATOR.NotEqual,
    label: TelemetryI18nKey.FilterConditionNotEqual,
    icon: <IconEqualNot {...BASE_BUTTON_ICON_PROPS} />,
  },
  { value: FILTER_OPERATOR.StartsWith, label: TelemetryI18nKey.FilterConditionStartsWith, icon: <StartsWith /> },
  { value: FILTER_OPERATOR.EndsWith, label: TelemetryI18nKey.FilterConditionEndsWith, icon: <EndsWith /> },
];
