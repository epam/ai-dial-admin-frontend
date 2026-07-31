import { SelectOption } from '@epam/ai-dial-ui-kit';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { CompactSelectOptionDescriptor } from '@/src/models/analytics/query-builder';

// Resolves a fixed option set's i18n keys against the caller's translator, so option lists can live
// in constants while their user-facing text stays translated.
export const toCompactSelectOptions = (
  descriptors: CompactSelectOptionDescriptor[],
  t: (key: QueryBuilderI18nKey) => string,
): SelectOption[] =>
  descriptors.map((descriptor) => ({
    value: descriptor.value,
    label: t(descriptor.labelKey),
    description: t(descriptor.descriptionKey),
  }));

// The words for a value, for row summaries. A value with no authoring option (e.g. the
// case-sensitive `co` of an authored query) shows its raw model value — the same thing the select's
// trigger falls back to, so the row and the control never disagree.
export const compactSelectLabel = (options: SelectOption[], value: string): string =>
  options.find((option) => option.value === value)?.label ?? value;
