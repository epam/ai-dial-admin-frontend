'use client';

import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import { MouseEvent, useEffect, useRef } from 'react';

import { isTestCaseGroupRow } from '@/src/components/Runs/models';
import { GroupedColumnsOptions } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

type Props = ICellRendererParams & Partial<GroupedColumnsOptions>;

/** The expand/collapse cell of the fixed left column; result rows leave it empty. */
const GroupToggleCellRenderer = ({ data, onToggleGroup, consumeFocusRequest }: Props) => {
  const t = useI18n();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const groupKey = isTestCaseGroupRow(data) ? data.groupKey : undefined;

  useEffect(() => {
    if (groupKey != null && consumeFocusRequest?.(groupKey)) buttonRef.current?.focus();
  }, [groupKey, consumeFocusRequest]);

  if (!isTestCaseGroupRow(data)) return null;

  const onToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleGroup?.(data.groupKey);
  };

  return (
    <div role="group" aria-label={data.testCaseName} className="flex items-center justify-center size-full">
      <button
        ref={buttonRef}
        type="button"
        aria-label={t(data.isExpanded ? RunsI18nKey.CollapseTestCaseGroup : RunsI18nKey.ExpandTestCaseGroup)}
        aria-expanded={data.isExpanded}
        className="flex items-center justify-center size-5 shrink-0 rounded hover:bg-layer-sunken focus-visible:bg-layer-sunken"
        onClick={onToggle}
      >
        {data.isExpanded ? <IconChevronDown size={14} aria-hidden /> : <IconChevronRight size={14} aria-hidden />}
      </button>
    </div>
  );
};

export default GroupToggleCellRenderer;
