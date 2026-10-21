import { describe, expect, test } from 'vitest';

import {
  countCsvRecords,
  getPartialExportNotice,
  toExportQuery,
} from '@/src/components/Analytics/QueryBuilder/utils/csv-export';
import { EXPORT_ROW_LIMIT } from '@/src/constants/analytics/query-builder';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { QueryMode, QueryPageType, QuerySortDirection, StructuredQuery } from '@/src/models/analytics/query';

const QUERY: StructuredQuery = {
  entity: 'dial_usage_log',
  mode: QueryMode.Row,
  sort: [{ field: 'timestamp', dir: QuerySortDirection.Desc }],
};

describe('toExportQuery', () => {
  test('moves an offset page to the first 1000 rows and keeps include_total', () => {
    const exported = toExportQuery({
      ...QUERY,
      page: { type: QueryPageType.Offset, offset: 50, limit: 25, include_total: true },
    });

    expect(exported).toEqual({
      ...QUERY,
      page: { type: QueryPageType.Offset, offset: 0, limit: EXPORT_ROW_LIMIT, include_total: true },
    });
  });

  test('restarts a cursor page from the beginning', () => {
    const exported = toExportQuery({ ...QUERY, page: { type: QueryPageType.Cursor, cursor: 'abc', limit: 100 } });

    expect(exported.page).toEqual({ type: QueryPageType.Cursor, cursor: null, limit: EXPORT_ROW_LIMIT });
  });

  test('gives a query with no page an offset page without a total', () => {
    expect(toExportQuery(QUERY).page).toEqual({
      type: QueryPageType.Offset,
      offset: 0,
      limit: EXPORT_ROW_LIMIT,
      include_total: false,
    });
  });

  test('leaves the rest of the query and the original untouched', () => {
    const page = { type: QueryPageType.Offset, offset: 5, limit: 5, include_total: false } as const;
    const original = { ...QUERY, page };

    const { page: _page, ...rest } = toExportQuery(original);

    expect(rest).toEqual(QUERY);
    expect(original.page).toBe(page);
  });
});

describe('countCsvRecords', () => {
  test('counts data records after the header', () => {
    expect(countCsvRecords('id,name\r\n1,a\r\n2,b\r\n')).toBe(2);
  });

  test('counts a last record without a trailing line break', () => {
    expect(countCsvRecords('id\r\n1\r\n2')).toBe(2);
  });

  test('does not count a line break inside a quoted field', () => {
    expect(countCsvRecords('id,text\r\n1,"line one\r\nline two"\r\n2,"say ""hi"""\r\n')).toBe(2);
  });

  test('returns zero for a header-only file', () => {
    expect(countCsvRecords('id,name\r\n')).toBe(0);
  });

  test('returns zero for an empty text', () => {
    expect(countCsvRecords('')).toBe(0);
  });
});

describe('getPartialExportNotice', () => {
  test('names the file count and the total when the total is larger', () => {
    expect(getPartialExportNotice(1000, 4200)).toEqual({
      key: QueryBuilderI18nKey.ExportCsvPartialOfTotal,
      params: { count: 1000, total: 4200 },
    });
  });

  test('warns at the maximum when no total was reported', () => {
    expect(getPartialExportNotice(EXPORT_ROW_LIMIT)).toEqual({
      key: QueryBuilderI18nKey.ExportCsvPartialAtLimit,
      params: { limit: EXPORT_ROW_LIMIT },
    });
  });

  test('says nothing for a file under the maximum', () => {
    expect(getPartialExportNotice(999)).toBeNull();
  });

  test('says nothing when the total matches the file', () => {
    expect(getPartialExportNotice(1000, 1000)).toBeNull();
  });
});
