import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { STACKED_LINE_HEIGHT, STACKED_ROW_PADDING } from '@/src/components/Grid/constants';
import { GroupedGridRow, TestCaseRow } from '@/src/models/evaluation/test-case-grouping';

const formatTurnValue = (turn: TestCaseRow, field: string): string => {
  const data = turn.data as Record<string, unknown> | undefined;
  const value = data?.[field] ?? turn[field];

  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const StackedTurnsCellRenderer = ({ data, colDef }: ICellRendererParams<GroupedGridRow>) => {
  const field = colDef?.field;
  const turns = data?.turns;

  if (data?.expanded || !field || !turns || turns.length === 0) return null;

  return (
    <div
      className="flex flex-col overflow-hidden"
      // Must match STACKED_LINE_HEIGHT/STACKED_ROW_PADDING used by useTurnGroupProjection's row-height
      // calculation exactly, or the ui-kit tooltip's own line-height overflows the reserved row height
      // and clips the last turn.
      style={{ paddingTop: STACKED_ROW_PADDING / 2, paddingBottom: STACKED_ROW_PADDING / 2 }}
    >
      {turns.map((turn, index) => (
        // Keyed by position, not `turn.id`: every turn of a case carries the same case id, so an
        // id key would collide across every line here. Position is the turn's identity.
        <div key={index} className="flex items-center" style={{ height: STACKED_LINE_HEIGHT }}>
          <DialEllipsisTooltip className="tiny" text={formatTurnValue(turn, field)} />
        </div>
      ))}
    </div>
  );
};

export default StackedTurnsCellRenderer;
