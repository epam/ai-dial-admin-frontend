'use client';

import { ColDef } from 'ag-grid-community';
import { FC, ReactNode, useCallback, useMemo } from 'react';

import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { CompareColumnPanelContext } from '@/src/components/Runs/Compare/ExecutionResults/models';
import {
  mergeComparePanelColumns,
  splitComparePanelColumns,
} from '@/src/components/Runs/Compare/ExecutionResults/utils/columns';
import { getCompareDiffSection } from '@/src/components/Runs/Compare/ExecutionResults/utils/diff-section';
import { ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  columns: ColDef[];
  onColumnsChange: (columns: ColDef[]) => void;
  onClose: () => void;
  panelClassName: string;
  withDiffSection?: boolean;
  viewDifferencesOnly?: boolean;
  onViewDifferencesOnlyChange?: (value: boolean) => void;
  hideHighlights?: boolean;
  onHideHighlightsChange?: (value: boolean) => void;
  diffSectionSwitchIdPrefix?: string;
}

const DisplayPanel: FC<Props> = ({
  columns,
  onColumnsChange,
  onClose,
  panelClassName,
  withDiffSection = true,
  viewDifferencesOnly = false,
  onViewDifferencesOnlyChange,
  hideHighlights = false,
  onHideHighlightsChange,
  diffSectionSwitchIdPrefix,
}) => {
  const t = useI18n();
  const { panelColumns, actionColumn } = useMemo(() => splitComparePanelColumns(columns), [columns]);

  const handleColumnsChange = useCallback(
    (newPanelColumns: ColDef[]) => {
      onColumnsChange(mergeComparePanelColumns(newPanelColumns, actionColumn));
    },
    [actionColumn, onColumnsChange],
  );

  const renderLabel = useCallback((node: ColDef, displayLabel: string): ReactNode => {
    const ctx = node.context as CompareColumnPanelContext | undefined;
    if (!ctx?.panelRunIndex) {
      return displayLabel;
    }

    return (
      <span className="inline-flex items-center gap-1 min-w-0">
        <span className="truncate">{displayLabel}</span>
        <CompareRunIndexBadge runIndex={ctx.panelRunIndex} />
      </span>
    );
  }, []);

  const diffSection = useMemo(() => {
    if (!withDiffSection || !onViewDifferencesOnlyChange || !onHideHighlightsChange) {
      return undefined;
    }

    return getCompareDiffSection(t, {
      viewDifferencesOnly,
      onViewDifferencesOnlyChange,
      hideHighlights,
      onHideHighlightsChange,
      switchIdPrefix: diffSectionSwitchIdPrefix ?? 'compare',
    });
  }, [
    withDiffSection,
    t,
    viewDifferencesOnly,
    onViewDifferencesOnlyChange,
    hideHighlights,
    onHideHighlightsChange,
    diffSectionSwitchIdPrefix,
  ]);

  return (
    <TreeColumnsPanel
      columns={panelColumns}
      onColumnsChange={handleColumnsChange}
      panelClassName={panelClassName}
      toggleColumnsPanel={onClose}
      title={t(RunsI18nKey.RunCompareDisplay)}
      renderLabel={renderLabel}
      diffSection={diffSection}
      treeSubtitle={t(ButtonsI18nKey.Columns)}
    />
  );
};

export default DisplayPanel;
