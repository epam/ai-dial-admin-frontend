'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { CellClickedEvent, ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconExclamationCircle } from '@tabler/icons-react';

import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

import FullscreenDiffViewer from './FullscreenDiffViewer';
import StatusBadge from './StatusBadge';
import { ComparisonSection, DiffViewState } from './models';
import { SECTION_I18N } from './constants';
import { formatFieldValue, valuesAreEqual } from './utils';

interface Props {
  sections: ComparisonSection[];
  activeDetail: AnalyticsResult | null;
  pinnedDetail: AnalyticsResult | null;
  spotlightedFields: Set<string>;
  runCompareNames?: { current: string; compared: string };
}

/** Shape of each row fed to the ag-grid. */
interface PivotRow {
  /** Unique row id */
  _id: string;
  /** Display name for the test case column */
  _testCaseName: string;
  /** Execution status for the badge */
  _executionStatus?: string;
  /** Index of this detail inside the `details` array (0 = pinned when two rows) */
  _rowIndex: number;
  /** Whether two rows are displayed (pinned + active) */
  _hasTwoRows: boolean;
  /**
   * Field values keyed by `sectionKey:fieldKey`.
   * Each value stores the raw string and a pre-computed diff CSS class.
   */
  [fullKey: string]: unknown;
}

interface FieldValueCell {
  raw: string | null;
  isFailed: boolean;
  diffClass: string;
}

// ── Cell renderer for the Test Case column ──────────────────────────────────
const TestCaseCellRenderer: FC<ICellRendererParams<PivotRow>> = (params) => {
  const row = params.data;
  if (!row) return null;
  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="truncate text-primary">{row._testCaseName}</span>
      <StatusBadge status={row._executionStatus as never} />
    </div>
  );
};

// ── Cell renderer for field value columns ───────────────────────────────────
const FieldValueCellRenderer: FC<ICellRendererParams<PivotRow>> = (params) => {
  const t = useI18n();
  const cell = params.value as FieldValueCell | undefined;
  if (!cell) return <span className="dial-caption-text text-secondary">—</span>;

  const { raw, isFailed } = cell;
  const displayText = formatFieldValue(raw);

  if (raw === null) {
    if (isFailed) {
      return (
        <DialTooltip tooltip={t(RunsI18nKey.MetricFailedText)}>
          <IconExclamationCircle size={14} className="text-error" />
        </DialTooltip>
      );
    }
    return <span className="dial-caption-text text-secondary">—</span>;
  }
  if (raw.includes('\n') || raw.length > 100) {
    return (
      <pre className="dial-caption-text whitespace-pre-wrap break-words overflow-y-auto max-h-[120px] font-mono">
        {displayText}
      </pre>
    );
  }
  return <span className="dial-caption-text">{displayText}</span>;
};

const ComparisonPivotView: FC<Props> = ({
  sections,
  activeDetail,
  pinnedDetail,
  spotlightedFields,
  runCompareNames,
}) => {
  const t = useI18n();
  const hasTwoRows = pinnedDetail != null && pinnedDetail.id !== activeDetail?.id;
  const [diffViewState, setDiffViewState] = useState<DiffViewState | null>(null);

  const details = useMemo(() => {
    const arr: AnalyticsResult[] = [];
    if (activeDetail) arr.push(activeDetail);
    if (pinnedDetail && hasTwoRows) arr.push(pinnedDetail);
    return arr;
  }, [activeDetail, pinnedDetail, hasTwoRows]);

  // Flatten all visible fields across sections
  const flatFields = useMemo(() => {
    return sections.flatMap((section) => {
      const i18nKey = SECTION_I18N[section.key];
      const resolvedLabel = i18nKey ? t(i18nKey) : section.label;
      return section.rows.map((row) => ({
        sectionKey: section.key,
        sectionLabel: resolvedLabel,
        fieldKey: row.fieldKey,
        label: row.label,
        isNumeric: row.isNumeric,
        values: row.values,
        fullKey: `${section.key}:${row.fieldKey}`,
      }));
    });
  }, [sections, t]);

  // ── Build row data ──────────────────────────────────────────────────────
  const rowData = useMemo<PivotRow[]>(() => {
    return details.map((detail, rowIdx) => {
      const runLabel = runCompareNames ? (rowIdx === 0 ? runCompareNames.current : runCompareNames.compared) : null;
      const row: PivotRow = {
        _id: detail.id ?? String(rowIdx),
        _testCaseName: runLabel ?? detail.testCaseName ?? detail.id ?? '',
        _executionStatus: runLabel ? undefined : detail.executionStatus,
        _rowIndex: rowIdx,
        _hasTwoRows: hasTwoRows,
      };

      const isPinnedRow = hasTwoRows && rowIdx === details.length - 1;

      for (const field of flatFields) {
        const val = field.values[rowIdx];
        const raw = val?.raw ?? null;
        const isFailed = val?.isFailed ?? false;

        // Diff highlighting on compared row (pinned)
        let diffClass = '';
        if (hasTwoRows && isPinnedRow && field.values.length >= 2) {
          const currentVal = field.values[0];
          const currentRaw = currentVal?.raw ?? null;
          const currentFailed = currentVal?.isFailed ?? false;
          if (currentFailed !== isFailed || !valuesAreEqual(currentRaw, raw)) {
            diffClass = field.isNumeric ? 'bg-warning' : 'bg-accent-secondary-alpha';
          }
        }

        row[field.fullKey] = { raw, isFailed, diffClass } satisfies FieldValueCell;
      }

      return row;
    });
  }, [details, flatFields, hasTwoRows, runCompareNames]);

  // ── Open fullscreen diff on cell click ───────────────────────────────────
  const onCellClicked = useCallback(
    (event: CellClickedEvent<PivotRow>) => {
      if (!hasTwoRows || rowData.length < 2) return;
      const colId = event.column.getColId();
      if (colId === '_testCaseName') return;

      const activeRow = rowData[0];
      const activeCell = activeRow[colId] as FieldValueCell | undefined;

      const pinnedRow = rowData[rowData.length - 1];
      const pinnedCell = pinnedRow[colId] as FieldValueCell | undefined;
      if (!pinnedCell?.diffClass) return;
      const field = flatFields.find((f) => f.fullKey === colId);

      setDiffViewState({
        fieldLabel: field?.label ?? colId,
        original: activeCell?.raw ?? '',
        modified: pinnedCell?.raw ?? '',
      });
    },
    [hasTwoRows, rowData, flatFields],
  );

  // ── Build column definitions ────────────────────────────────────────────
  const columnDefs = useMemo<(ColDef | ColGroupDef)[]>(() => {
    // Test Case / Run column (pinned left)
    const testCaseCol: ColDef<PivotRow> = {
      headerName: runCompareNames ? t(RunsI18nKey.FieldColumn) : t(RunsI18nKey.TestCaseColumn),
      colId: '_testCaseName',
      field: '_testCaseName',
      pinned: 'left',
      minWidth: 200,
      cellRenderer: TestCaseCellRenderer,
      filter: false,
      sortable: false,
    };

    // Group fields by section
    const sectionGroupMap = new Map<string, { label: string; columns: ColDef<PivotRow>[] }>();

    for (const field of flatFields) {
      let group = sectionGroupMap.get(field.sectionKey);
      if (!group) {
        group = { label: field.sectionLabel, columns: [] };
        sectionGroupMap.set(field.sectionKey, group);
      }

      const isSpotlighted = spotlightedFields.has(field.fullKey);

      const col: ColDef<PivotRow> = {
        colId: field.fullKey,
        headerName: field.label,
        minWidth: 180,
        flex: 1,
        filter: false,
        sortable: false,
        valueGetter: (params) => params.data?.[field.fullKey] as FieldValueCell | undefined,
        cellRenderer: FieldValueCellRenderer,
        cellStyle: (params) => {
          const cell = params.value as FieldValueCell | undefined;
          if (cell?.diffClass === 'bg-warning') {
            return { backgroundColor: 'var(--bg-warning)', cursor: 'pointer' };
          }
          if (cell?.diffClass === 'bg-accent-secondary-alpha') {
            return { backgroundColor: 'var(--bg-accent-secondary-alpha)', cursor: 'pointer' };
          }
          return undefined;
        },
        cellClass: (params) => {
          const cell = params.value as FieldValueCell | undefined;
          return cell?.diffClass || '';
        },
        headerClass: isSpotlighted ? 'pivot-spotlight-header' : '',
      };

      group.columns.push(col);
    }

    // Build column groups (one per section)
    const groupDefs: (ColDef | ColGroupDef)[] = [];
    for (const [, group] of sectionGroupMap) {
      if (group.columns.length === 1) {
        // Single column in a section — wrap in a group anyway to show the section label
        groupDefs.push({
          headerName: group.label,
          headerClass: 'uppercase text-secondary dial-caption-semi-text',
          children: group.columns,
        } as ColGroupDef);
      } else {
        groupDefs.push({
          headerName: group.label,
          headerClass: 'uppercase text-secondary dial-caption-semi-text',
          children: group.columns,
        } as ColGroupDef);
      }
    }

    return [testCaseCol, ...groupDefs];
  }, [t, flatFields, spotlightedFields, runCompareNames]);

  return (
    <div className="animate-fadeIn h-full overflow-auto pivot-grid-container">
      <style>{`
        .pivot-spotlight-header {
          border-top: 2px solid var(--controls-bg-solid-primary, #3664E2) !important;
        }
        .pivot-grid-container .ag-header-group-cell {
          font-size: 12px;
          text-transform: uppercase;
        }
      `}</style>
      <AgGridWrapper
        columnDefs={columnDefs}
        rowData={rowData}
        additionalGridOptions={{
          headerHeight: 56,
          groupHeaderHeight: 28,
          rowHeight: 48,
          defaultColDef: {
            filter: false,
            floatingFilter: false,
            resizable: true,
            suppressMovable: true,
          },
          suppressCellFocus: true,
          suppressRowHoverHighlight: true,
          domLayout: details.length <= 2 ? 'autoHeight' : 'normal',
          onCellClicked,
        }}
      />
      {diffViewState && (
        <FullscreenDiffViewer
          isOpen={true}
          fieldLabel={diffViewState.fieldLabel}
          original={diffViewState.original}
          modified={diffViewState.modified}
          originalLabel={runCompareNames?.current ?? activeDetail?.testCaseName ?? activeDetail?.id ?? ''}
          modifiedLabel={runCompareNames?.compared ?? pinnedDetail?.testCaseName ?? pinnedDetail?.id ?? ''}
          onClose={() => setDiffViewState(null)}
        />
      )}
    </div>
  );
};

export default ComparisonPivotView;
