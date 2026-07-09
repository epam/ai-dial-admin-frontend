import { SelectOption } from '@epam/ai-dial-ui-kit';

import { GridI18nKey } from '@/src/constants/i18n';
import { GridFilterType } from '@/src/types/grid-filter';

type TranslateFn = (key: GridI18nKey) => string;

export const getTextOperatorOptions = (t: TranslateFn): SelectOption[] => [
  { value: GridFilterType.CONTAINS, label: t(GridI18nKey.FilterContains) },
  { value: GridFilterType.NOT_CONTAINS, label: t(GridI18nKey.FilterNotContains) },
  { value: GridFilterType.EQUALS, label: t(GridI18nKey.FilterEquals) },
  { value: GridFilterType.NOT_EQUAL, label: t(GridI18nKey.FilterNotEqual) },
];

export const getNumericOperatorOptions = (t: TranslateFn): SelectOption[] => [
  { value: GridFilterType.GREATER_THAN, label: t(GridI18nKey.FilterGreaterThan) },
  { value: GridFilterType.GREATER_THAN_OR_EQUAL, label: t(GridI18nKey.FilterGreaterThanOrEqual) },
  { value: GridFilterType.LESS_THAN, label: t(GridI18nKey.FilterLessThan) },
  { value: GridFilterType.LESS_THAN_OR_EQUAL, label: t(GridI18nKey.FilterLessThanOrEqual) },
  { value: GridFilterType.EQUALS, label: t(GridI18nKey.FilterEquals) },
  { value: GridFilterType.NOT_EQUAL, label: t(GridI18nKey.FilterNotEqual) },
];
