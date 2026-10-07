import { GridApi, IRowNode } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import {
  getAnalyticsImportColDefs,
  getAnalyticsImportRows,
  getAnalyticsImportTabs,
  getReusedNames,
  hasFailRow,
  isAnalyticsImportBlocked,
} from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { CatalogImportEntry, CatalogImportPreview } from '@/src/models/analytics/catalog-import';
import { AnalyticsImportPreviewTab, CatalogImportAction } from '@/src/types/analytics/import';

const t = (key: string) => key;

const entry = (overrides: Partial<CatalogImportEntry>): CatalogImportEntry => ({
  name: 'usage_sentiment',
  import_action: CatalogImportAction.CREATE,
  ...overrides,
});

const preview = (overrides: Partial<CatalogImportPreview> = {}): CatalogImportPreview => ({
  required_system_tables: [],
  tables: [],
  pipelines: [],
  env_specific: [],
  validation_errors: [],
  ...overrides,
});

describe('getAnalyticsImportRows', () => {
  test('maps the service codes to the admin action labels and joins problems', () => {
    const rows = getAnalyticsImportRows(
      preview({
        tables: [entry({ import_action: CatalogImportAction.SKIP, differs: true })],
        pipelines: [
          entry({ name: 'p', import_action: CatalogImportAction.FAIL, problems: ['a', 'b'], armable: false }),
        ],
      }),
      t,
    );

    expect(rows[AnalyticsImportPreviewTab.TABLES][0]).toEqual(
      expect.objectContaining({ action: 'Skip', isInvalid: false, problems: '' }),
    );
    expect(rows[AnalyticsImportPreviewTab.PIPELINES][0]).toEqual(
      expect.objectContaining({ action: 'Fail', isInvalid: true, problems: 'a; b' }),
    );
  });
});

describe('getAnalyticsImportTabs', () => {
  test('marks only the tab holding an invalid row', () => {
    const rows = getAnalyticsImportRows(
      preview({ pipelines: [entry({ name: 'p', import_action: CatalogImportAction.FAIL })] }),
      t,
    );

    expect(getAnalyticsImportTabs(rows, t).map(({ id, invalid }) => [id, invalid])).toEqual([
      [AnalyticsImportPreviewTab.TABLES, false],
      [AnalyticsImportPreviewTab.PIPELINES, true],
      [AnalyticsImportPreviewTab.REQUIRED_SYSTEM_TABLES, false],
    ]);
  });
});

describe('getAnalyticsImportColDefs', () => {
  const fields = (tab: AnalyticsImportPreviewTab, hasResult: boolean) =>
    getAnalyticsImportColDefs(tab, t, () => undefined, hasResult).map(({ field }) => field);

  test('hides Compare on a row with no existing object', () => {
    const actionColumn = getAnalyticsImportColDefs(AnalyticsImportPreviewTab.TABLES, t, () => undefined, false).at(-1);
    const [compare] = actionColumn?.cellRendererParams.items as ActionMenuOperationDeclaration<unknown>[];
    const isHiddenFor = (row: object) => compare.hidden?.({} as GridApi, { data: row } as IRowNode);

    expect(isHiddenFor({ entry: entry({}) })).toBe(true);
    expect(isHiddenFor({ entry: entry({ prev: { name: 'x' } }) })).toBe(false);
  });

  test('shows Can be enabled on pipelines only and Status only with a result', () => {
    expect(fields(AnalyticsImportPreviewTab.PIPELINES, false)).toContain('canEnable');
    expect(fields(AnalyticsImportPreviewTab.TABLES, false)).not.toContain('canEnable');
    expect(fields(AnalyticsImportPreviewTab.TABLES, false)).not.toContain('status');
    expect(fields(AnalyticsImportPreviewTab.TABLES, true)).toContain('status');
  });
});

describe('isAnalyticsImportBlocked', () => {
  test('blocks without a preview', () => {
    expect(isAnalyticsImportBlocked(undefined, false)).toBe(true);
  });

  test('blocks on validation errors', () => {
    expect(isAnalyticsImportBlocked(preview({ validation_errors: ['bad'] }), false)).toBe(true);
  });

  test('blocks on a Fail row', () => {
    expect(
      isAnalyticsImportBlocked(preview({ tables: [entry({ import_action: CatalogImportAction.FAIL })] }), false),
    ).toBe(true);
  });

  test('blocks on an unconfirmed re-used name and allows it once confirmed', () => {
    const reused = preview({ pipelines: [entry({ name: 'p', reused_name: true })] });

    expect(isAnalyticsImportBlocked(reused, false)).toBe(true);
    expect(isAnalyticsImportBlocked(reused, true)).toBe(false);
  });

  test('allows a clean preview', () => {
    expect(isAnalyticsImportBlocked(preview({ tables: [entry({})] }), false)).toBe(false);
  });
});

describe('getReusedNames / hasFailRow', () => {
  test('collect re-used names and detect Fail rows across tabs', () => {
    const value = preview({
      pipelines: [entry({ name: 'p', reused_name: true })],
      required_system_tables: [entry({ name: 'dial_usage_log', import_action: CatalogImportAction.FAIL })],
    });

    expect(getReusedNames(value)).toEqual(['p']);
    expect(hasFailRow(value)).toBe(true);
    expect(hasFailRow(preview())).toBe(false);
  });
});
