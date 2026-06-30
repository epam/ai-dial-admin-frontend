'use client';

import { IconArrowsLeftRight, IconTable } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useMemo } from 'react';

import SegmentedControl from '@/src/components/Common/SegmentedControl/SegmentedControl';
import { SegmentedControlOption } from '@/src/components/Common/SegmentedControl/models';
import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import { getCompareDiffSection } from '@/src/components/Runs/Compare/ExecutionResults/utils/diff-section';
import { RowDetailViewMode } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  columns: ColDef[];
  onColumnsChange: (columns: ColDef[]) => void;
  onClose: () => void;
  panelClassName: string;
  viewMode: RowDetailViewMode;
  onViewModeChange: (mode: RowDetailViewMode) => void;
  viewDifferencesOnly: boolean;
  onViewDifferencesOnlyChange: (value: boolean) => void;
  hideHighlights: boolean;
  onHideHighlightsChange: (value: boolean) => void;
}

const CompareRowDetailDisplayPanel: FC<Props> = ({
  columns,
  onColumnsChange,
  onClose,
  panelClassName,
  viewMode,
  onViewModeChange,
  viewDifferencesOnly,
  onViewDifferencesOnlyChange,
  hideHighlights,
  onHideHighlightsChange,
}) => {
  const t = useI18n();

  const viewModeOptions = useMemo<SegmentedControlOption<RowDetailViewMode>[]>(
    () => [
      { value: RowDetailViewMode.Table, label: t(RunsI18nKey.RunCompareTable), icon: <IconTable size={16} /> },
      {
        value: RowDetailViewMode.Pivot,
        label: t(RunsI18nKey.RunComparePivot),
        icon: <IconArrowsLeftRight size={16} />,
      },
    ],
    [t],
  );

  const diffSection = useMemo(
    () =>
      getCompareDiffSection(t, {
        viewDifferencesOnly,
        onViewDifferencesOnlyChange,
        hideHighlights,
        onHideHighlightsChange,
        switchIdPrefix: 'row-detail',
      }),
    [t, viewDifferencesOnly, onViewDifferencesOnlyChange, hideHighlights, onHideHighlightsChange],
  );

  const renderLabel = useCallback(
    (node: ColDef, displayLabel: string) => {
      const key = (node.context as { panelName?: string } | undefined)?.panelName ?? '';
      const sectionI18nKey = SECTION_I18N[key];
      if (sectionI18nKey) {
        return t(sectionI18nKey);
      }
      return node.headerName?.trim() || displayLabel;
    },
    [t],
  );

  return (
    <TreeColumnsPanel
      columns={columns}
      onColumnsChange={onColumnsChange}
      panelClassName={panelClassName}
      toggleColumnsPanel={onClose}
      title={t(RunsI18nKey.RunCompareDisplay)}
      diffSection={diffSection}
      treeSubtitle={t(RunsI18nKey.RunCompareRows)}
      topSlot={
        <SegmentedControl options={viewModeOptions} value={viewMode} onChange={onViewModeChange} className="mb-4" />
      }
      renderLabel={renderLabel}
    />
  );
};

export default CompareRowDetailDisplayPanel;
