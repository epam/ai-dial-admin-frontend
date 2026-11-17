import { LimitChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { QueryPageType } from '@/src/models/analytics/query';
import { PageState } from '@/src/models/analytics/query-builder';

const WHOLE_NUMBER = /^\d+$/;

const toWholeNumber = (value: string): number | null => (WHOLE_NUMBER.test(value.trim()) ? Number(value) : null);

export const toLimitForm = (page: PageState): LimitChipForm => ({
  rows: String(page.limit),
  offset: String(page.offset),
});

export const isLimitFormValid = (form: LimitChipForm): boolean => {
  const rows = toWholeNumber(form.rows);
  return rows != null && rows >= 1 && toWholeNumber(form.offset) != null;
};

export const withLimit = (page: PageState, form: LimitChipForm): PageState => ({
  ...page,
  enabled: true,
  type: QueryPageType.Offset,
  limit: toWholeNumber(form.rows) ?? page.limit,
  offset: toWholeNumber(form.offset) ?? page.offset,
  includeTotal: false,
});
