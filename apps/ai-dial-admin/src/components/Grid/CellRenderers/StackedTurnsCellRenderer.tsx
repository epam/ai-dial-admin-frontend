import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { STACKED_LINE_HEIGHT, STACKED_ROW_PADDING } from '@/src/components/Grid/constants';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseRow } from '@/src/types/test-case-row';

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

  if (!field || !turns || turns.length === 0) return null;

  if (data?.expanded) {
    return <DialEllipsisTooltip className="tiny" text="—" />;
  }

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ paddingTop: STACKED_ROW_PADDING / 2, paddingBottom: STACKED_ROW_PADDING / 2 }}
    >
      {turns.map((turn, index) => (
        <div key={index} className="flex items-center" style={{ height: STACKED_LINE_HEIGHT }}>
          <DialEllipsisTooltip className="tiny" text={formatTurnValue(turn, field)} />
        </div>
      ))}
    </div>
  );
};

export default StackedTurnsCellRenderer;
