import { GridApi, IRowNode } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';
import { TabStatus } from '@epam/ai-dial-ui-kit';

import {
  getAnalyticsImportColDefs,
  getAnalyticsImportRows,
  getAnalyticsImportTabs,
  getReusedNames,
  hasFailRow,
  hasNoTablesOrPipelines,
  isAnalyticsImportBlocked,
} from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import {
  CatalogAccessImportEntry,
  CatalogImportEntry,
  CatalogImportPreview,
} from '@/src/models/analytics/catalog-import';
import { IneffectiveGrantReason, TableGrantKey } from '@/src/models/analytics/table';
import { ImportConfigurationAction } from '@/src/types/import';
import { ImportI18nKey } from '@/src/constants/i18n';
import {
  AnalyticsImportPreviewTab,
  CatalogAccessImportAction,
  CatalogAccessImportStatus,
  CatalogImportAction,
} from '@/src/types/analytics/import';

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

    expect(getAnalyticsImportTabs(rows, t).map(({ id, status }) => [id, status === TabStatus.Error])).toEqual([
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

const accessEntry = (overrides: Partial<CatalogAccessImportEntry> = {}): CatalogAccessImportEntry => ({
  table: 'dial_usage_log',
  role: 'analytics-viewers',
  import_action: CatalogAccessImportAction.CREATE,
  prev: null,
  next: { privileges: [TableGrantKey.Read], rows: null, columns: null },
  problems: [],
  ineffective_grants: [],
  ...overrides,
});

describe('getAnalyticsImportRows — access', () => {
  test('maps Replace to the changed action and joins ineffective grant messages', () => {
    const [row] = getAnalyticsImportRows(
      preview({
        access: [
          accessEntry({
            import_action: CatalogAccessImportAction.REPLACE,
            prev: { privileges: [], rows: null, columns: null },
            ineffective_grants: [
              {
                role: 'analytics-viewers',
                key: TableGrantKey.Read,
                reason: IneffectiveGrantReason.AlreadyGlobal,
                message: 'm1',
              },
              {
                role: 'analytics-viewers',
                key: TableGrantKey.Read,
                reason: IneffectiveGrantReason.AlreadyGlobal,
                message: 'm2',
              },
            ],
          }),
        ],
      }),
      t,
    )[AnalyticsImportPreviewTab.ACCESS];

    expect(row).toEqual(
      expect.objectContaining({
        name: 'dial_usage_log / analytics-viewers',
        table: 'dial_usage_log',
        role: 'analytics-viewers',
        action: ImportConfigurationAction.UPDATE,
        ineffectiveGrants: 'm1; m2',
        isInvalid: false,
      }),
    );
  });

  test('marks a Fail entry invalid and maps result statuses', () => {
    const rows = getAnalyticsImportRows(
      {
        ...preview(),
        access: [
          accessEntry({ import_action: CatalogAccessImportAction.FAIL, problems: ['validation_error: bad'] }),
          accessEntry({ role: 'r2', status: CatalogAccessImportStatus.REPLACED }),
        ],
      },
      t,
    )[AnalyticsImportPreviewTab.ACCESS];

    expect(rows[0]).toEqual(
      expect.objectContaining({ action: 'Fail', problems: 'validation_error: bad', isInvalid: true }),
    );
    expect(rows[1].status).toBe(ImportI18nKey.AnalyticsStatusReplaced);
  });
});

describe('getAnalyticsImportTabs — access', () => {
  test('hides the Access tab when the access list is empty', () => {
    const tabs = getAnalyticsImportTabs(getAnalyticsImportRows(preview({ access: [] }), t), t);

    expect(tabs.map(({ id }) => id)).not.toContain(AnalyticsImportPreviewTab.ACCESS);
  });

  test('shows the Access tab last and marks it invalid on a Fail entry', () => {
    const rows = getAnalyticsImportRows(
      preview({ access: [accessEntry({ import_action: CatalogAccessImportAction.FAIL })] }),
      t,
    );
    const tabs = getAnalyticsImportTabs(rows, t);

    expect(tabs.at(-1)).toEqual(
      expect.objectContaining({ id: AnalyticsImportPreviewTab.ACCESS, status: TabStatus.Error }),
    );
  });
});

describe('getAnalyticsImportColDefs — access', () => {
  test('shows table, role, problems and ineffective grants, and status with a result', () => {
    const fields = getAnalyticsImportColDefs(AnalyticsImportPreviewTab.ACCESS, t, () => undefined, true)
      .map(({ field }) => field)
      .slice(0, 6);

    expect(fields).toEqual(['action', 'table', 'role', 'problems', 'ineffectiveGrants', 'status']);
  });
});

describe('isAnalyticsImportBlocked — access', () => {
  test('blocks the import on a refused access entry', () => {
    expect(
      isAnalyticsImportBlocked(
        preview({ access: [accessEntry({ import_action: CatalogAccessImportAction.FAIL })] }),
        false,
      ),
    ).toBe(true);
  });

  test('does not block on ineffective grants alone', () => {
    const grant = { role: 'r', key: TableGrantKey.Read, reason: IneffectiveGrantReason.AlreadyGlobal, message: 'm' };

    expect(isAnalyticsImportBlocked(preview({ access: [accessEntry({ ineffective_grants: [grant] })] }), false)).toBe(
      false,
    );
  });

  test('keeps the Skip if exists hint for object failures only', () => {
    expect(hasFailRow(preview({ access: [accessEntry({ import_action: CatalogAccessImportAction.FAIL })] }))).toBe(
      false,
    );
  });
});

describe('hasNoTablesOrPipelines', () => {
  test('is true only when the preview holds neither tables nor pipelines', () => {
    expect(hasNoTablesOrPipelines(preview())).toBe(true);
    expect(hasNoTablesOrPipelines(preview({ tables: [entry({})] }))).toBe(false);
    expect(hasNoTablesOrPipelines(preview({ pipelines: [entry({ name: 'usage_enrich' })] }))).toBe(false);
  });
});
