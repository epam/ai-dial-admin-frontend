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

/**
 * Read-only cell for a GROUP summary row: renders every turn's value for the column's field, one
 * line per turn, so a collapsed multi-turn case previews all its turns at a glance.
 */
const StackedTurnsCellRenderer = ({ data, colDef }: ICellRendererParams<GroupedGridRow>) => {
  const field = colDef?.field;
  const turns = data?.turns;
  if (!field || !turns?.length) return null;

  return (
    <div className="flex flex-col gap-0.5 py-1">
      {turns.map((turn, index) => {
        const value = readTurnFieldValue(turn, field);
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
