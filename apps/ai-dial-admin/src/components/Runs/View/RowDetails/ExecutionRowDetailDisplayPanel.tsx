'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback } from 'react';

import TreeColumnsPanel from '@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel';
import { SECTION_I18N } from '@/src/components/Runs/Details/BottomDrawer/constants';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  columns: ColDef[];
  onColumnsChange: (columns: ColDef[]) => void;
  onClose: () => void;
  panelClassName: string;
}

const ExecutionRowDetailDisplayPanel: FC<Props> = ({ columns, onColumnsChange, onClose, panelClassName }) => {
  const t = useI18n();

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
      treeSubtitle={t(RunsI18nKey.RunCompareRows)}
      renderLabel={renderLabel}
    />
  );
};

export default ExecutionRowDetailDisplayPanel;
