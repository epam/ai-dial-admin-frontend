import { MouseEvent } from 'react';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';

import { ExecutionResultRowType, GroupedAnalyticsResult } from '@/src/components/Runs/ExecutionResults/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props extends ICellRendererParams<GroupedAnalyticsResult> {
  onToggleGroup?: (groupKey: string) => void;
}

const TestCaseGroupCellRenderer = ({ data, value, onToggleGroup }: Props) => {
  const t = useI18n();

  if (data?.resultRowType !== ExecutionResultRowType.Group) {
    return <span className="pl-6">{value}</span>;
  }

  const isExpanded = Boolean(data.isExpanded);
  const onToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleGroup?.(data.groupKey);
  };

  return (
    <div className="flex items-center gap-1 h-full min-w-0">
      <button
        type="button"
        aria-label={t(isExpanded ? RunsI18nKey.CollapseTestCaseGroup : RunsI18nKey.ExpandTestCaseGroup)}
        aria-expanded={isExpanded}
        className="flex items-center justify-center size-[18px] shrink-0 rounded hover:bg-layer-3 focus-visible:bg-layer-3"
        onClick={onToggle}
      >
        {isExpanded ? <IconChevronDown size={14} aria-hidden /> : <IconChevronRight size={14} aria-hidden />}
      </button>
      <span className="truncate font-semibold">{value}</span>
    </div>
  );
};

export default TestCaseGroupCellRenderer;
