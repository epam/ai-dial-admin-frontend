import { ICellRendererParams } from 'ag-grid-community';

import { DialEllipsisTooltip, DialTag } from '@epam/ai-dial-ui-kit';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';

const TestCaseNameCellRenderer = ({ data }: ICellRendererParams<GroupedGridRow>) => {
  const t = useI18n();

  if (data?.rowType === GridRowType.TURN) {
    return (
      <div className="flex items-center min-w-0 pl-6">
        <span className="text-secondary italic">{t(TestSuitesI18nKey.TurnLabel, { index: data.turnNumber ?? 0 })}</span>
      </div>
    );
  }

  if (data?.rowType === GridRowType.GROUP) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <DialEllipsisTooltip className="min-w-0" text={(data.testCaseName as string | undefined) ?? ''} />
        <DialTag
          label={t(TestSuitesI18nKey.TurnCountBadge, { count: data.turnCount ?? 0 })}
          className="bg-accent-tertiary-alpha border border-accent-tertiary rounded-sm shrink-0"
        />
      </div>
    );
  }

  return null;
};

export default TestCaseNameCellRenderer;
