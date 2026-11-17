import { SelectOption } from '@epam/ai-dial-ui-kit';

import { FieldOption } from '@/src/models/analytics/query-builder';

export const toSelectOptions = (options: FieldOption[]): SelectOption[] =>
  options.map((option) => ({ value: option.name, label: option.display_name || option.name }));

export const valuesToSelectOptions = (values: string[]): SelectOption[] =>
  values.map((value) => ({ value, label: value }));
