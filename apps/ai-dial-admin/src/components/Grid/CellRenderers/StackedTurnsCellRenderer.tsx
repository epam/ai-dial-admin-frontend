'use client';

import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';

/** Read a single field's value from a turn row (nested `data` first, then top-level fallback). */
const readTurnFieldValue = (turn: TestCaseRow, field: string): string => {
  const nested = (turn.data as Record<string, unknown> | undefined)?.[field];
  const value = nested ?? turn[field];
  if (value == null || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

/** Optional per-turn value accessor (e.g. reusing a results column's own `valueGetter`). */
interface StackedTurnsParams {
  getTurnValue?: (turn: TestCaseRow) => unknown;
}

/**
 * Read-only cell for a GROUP summary row: renders every turn's value for the column, one line per
 * turn, so a collapsed multi-turn case/conversation previews all its turns at a glance. By default
 * the value is read from the turn's `data[field]`/top-level field; a `getTurnValue` param overrides
 * that (used by the results grid to reuse each column's computed value).
 */
const StackedTurnsCellRenderer = ({
  data,
  colDef,
  getTurnValue,
}: ICellRendererParams<GroupedGridRow> & StackedTurnsParams) => {
  const field = colDef?.field;
  const turns = data?.turns;
  // When the group is expanded, its turn rows already show each value — stacking here too is
  // redundant noise, so the summary row stays blank until it is collapsed.
  if (data?.expanded) return null;
  if ((!field && !getTurnValue) || !turns?.length) return null;

  const valueOf = (turn: TestCaseRow): string => {
    if (getTurnValue) {
      const raw = getTurnValue(turn);
      if (raw == null || raw === '') return '';
      return typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
    }
    return readTurnFieldValue(turn, field as string);
  };

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {turns.map((turn, index) => {
        const value = valueOf(turn);
        return (
          <DialEllipsisTooltip
            key={String(turn.id ?? index)}
            className="leading-[18px] text-secondary"
            text={value || '—'}
          />
        );
      })}
    </div>
  );
};

export default StackedTurnsCellRenderer;
