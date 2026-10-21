import { EXPORT_ROW_LIMIT } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { QueryPage, QueryPageType, StructuredQuery } from '@/src/models/analytics/query';
import { PartialExportNotice } from '@/src/models/analytics/query-builder';

const toExportPage = (page?: QueryPage): QueryPage => {
  if (page?.type === QueryPageType.Cursor) {
    return { type: QueryPageType.Cursor, cursor: null, limit: EXPORT_ROW_LIMIT };
  }

  return {
    type: QueryPageType.Offset,
    offset: 0,
    limit: EXPORT_ROW_LIMIT,
    include_total: page?.include_total ?? false,
  };
};

/**
 * The run's query as an export asks for it: the first page at the service's per-request maximum, whatever
 * page the grid was on. Everything but the page is the run's own, so the file has the grid's columns and order.
 */
export const toExportQuery = (query: StructuredQuery): StructuredQuery => ({
  ...query,
  page: toExportPage(query.page),
});

/**
 * Data records in an RFC 4180 text, the header excluded. A line break inside a quoted field belongs to that
 * field, so counting lines would over-count any cell that holds one.
 */
export const countCsvRecords = (text: string): number => {
  let records = 0;
  let isQuoted = false;
  let hasContent = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      isQuoted = !isQuoted;
      hasContent = true;
    } else if (char === '\n' && !isQuoted) {
      records++;
      hasContent = false;
    } else if (char !== '\r' || isQuoted) {
      hasContent = true;
    }
  }

  // A last record without a trailing line break still counts.
  if (hasContent) {
    records++;
  }

  return Math.max(records - 1, 0);
};

/**
 * Whether a file of `count` records may be missing matching rows, and how to say so. A reported total is the
 * exact answer; without one, a file at the service's maximum can only be called possibly partial.
 */
export const getPartialExportNotice = (count: number, totalCount?: number): PartialExportNotice | null => {
  if (totalCount != null && totalCount > count) {
    return { key: QueryBuilderI18nKey.ExportCsvPartialOfTotal, params: { count, total: totalCount } };
  }

  if (totalCount == null && count >= EXPORT_ROW_LIMIT) {
    return { key: QueryBuilderI18nKey.ExportCsvPartialAtLimit, params: { limit: EXPORT_ROW_LIMIT } };
  }

  return null;
};
