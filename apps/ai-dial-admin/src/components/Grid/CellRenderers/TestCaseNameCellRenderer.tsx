import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip, DialTag } from '@epam/ai-dial-ui-kit';

import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { GridRowType } from '@/src/types/grid-row-type';

interface TestCaseNameCellRendererParams extends ICellRendererParams<GroupedGridRow> {
  onChange?: (value: number | string, data: unknown, column: string, index?: number) => void;
  isReadonly?: boolean;
}

const TestCaseNameCellRenderer = (params: TestCaseNameCellRendererParams) => {
  const t = useI18n();
  const { data, isReadonly } = params;

  if (data?.rowType !== GridRowType.GROUP && data?.rowType !== GridRowType.TURN) return null;

  const turnLabel = (
    <span className="text-secondary italic shrink-0">
      {t(TestSuitesI18nKey.TurnLabel, { index: data.turnNumber ?? 0 })}
    </span>
  );

  if (data.rowType === GridRowType.TURN && !data.isFlattened) {
    return <div className="flex items-center min-w-0 pl-6">{turnLabel}</div>;
  }

  const name = (data.testCaseName as string | undefined) ?? '';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative flex-1 min-w-0">
        {isReadonly ? (
          <DialEllipsisTooltip className="min-w-0" text={name} />
        ) : (
          <EditableCellRenderer {...params} hideTriangle skipRequired />
        )}
      </div>
      {data.rowType === GridRowType.TURN ? (
        turnLabel
      ) : (
        <DialTag
          label={t(TestSuitesI18nKey.TurnCountBadge, { count: data.turnCount ?? 0 })}
          className="bg-accent-tertiary-alpha border border-accent-tertiary rounded-sm shrink-0"
        />
      )}
    </div>
  );
};

export default TestCaseNameCellRenderer;
