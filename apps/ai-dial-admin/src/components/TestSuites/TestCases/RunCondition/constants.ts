import Contains from '@/public/images/icons/filter/contains.svg';
import NotContains from '@/public/images/icons/filter/not-contains.svg';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { IconEqual, IconEqualNot } from '@tabler/icons-react';
import { createElement, ReactNode } from 'react';

import { RunConditionLogicalOp, RunConditionOperator } from './models';

export const RUN_CONDITION_OPERATOR_OPTIONS: {
  value: RunConditionOperator;
  label: string;
  icon: ReactNode;
}[] = [
  {
    value: RunConditionOperator.Contain,
    label: TelemetryI18nKey.FilterConditionContain,
    icon: createElement(Contains),
  },
  {
    value: RunConditionOperator.NotContains,
    label: TelemetryI18nKey.FilterConditionNotContain,
    icon: createElement(NotContains),
  },
  {
    value: RunConditionOperator.Equal,
    label: TelemetryI18nKey.FilterConditionEqual,
    icon: createElement(IconEqual, BASE_BUTTON_ICON_PROPS),
  },
  {
    value: RunConditionOperator.NotEqual,
    label: TelemetryI18nKey.FilterConditionNotEqual,
    icon: createElement(IconEqualNot, BASE_BUTTON_ICON_PROPS),
  },
];

export const RUN_CONDITION_LOGICAL_OPTIONS: { value: RunConditionLogicalOp; label: string }[] = [
  { value: RunConditionLogicalOp.And, label: 'And' },
  { value: RunConditionLogicalOp.Or, label: 'Or' },
];

export const BASE_RUN_CONDITION_FIELDS = [
  { field: 'id', displayName: 'ID', isArray: false },
  { field: 'test_case_name', displayName: 'Test case name', isArray: false },
] as const;

export const DATA_FIELD_PREFIX = 'data::';

export const INCLUDED_IDS_PAGE_SIZE = 1000;

export const PREVIEW_DEBOUNCE_MS = 300;
