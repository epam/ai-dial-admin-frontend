'use client';

import { FC, useState } from 'react';
import { createPortal } from 'react-dom';

import { Resizable } from 're-resizable';

import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import ResizeHandle from '@/src/components/Runs/Details/BottomDrawer/ResizeHandle';
import {
  DEFAULT_DRAWER_HEIGHT,
  MAX_DRAWER_OFFSET,
  MIN_DRAWER_HEIGHT,
} from '@/src/components/Runs/Details/BottomDrawer/constants';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  onSwitchToSidebar: () => void;
}

const CompareRowDetailDrawer: FC<Props> = ({ row, primaryRunName, comparedRunName, onClose, onSwitchToSidebar }) => {
  const t = useI18n();
  const [panelHeight, setPanelHeight] = useState(DEFAULT_DRAWER_HEIGHT);

  const maxHeight = typeof window !== 'undefined' ? window.innerHeight - MAX_DRAWER_OFFSET : MIN_DRAWER_HEIGHT;

  return createPortal(
    <Resizable
      size={{ width: '100%', height: panelHeight }}
      minHeight={MIN_DRAWER_HEIGHT}
      maxHeight={maxHeight}
      enable={{ top: true }}
      handleComponent={{ top: <ResizeHandle /> }}
      handleStyles={{ top: { height: '10px', top: 0 } }}
      onResizeStop={(_e, _dir, _ref, delta) => {
        setPanelHeight((prev) => prev + delta.height);
      }}
      className="fixed !bottom-0 !inset-x-0 z-[35] bg-layer-0 border-t border-primary flex flex-col"
      style={{ position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto' }}
    >
      <div className="flex flex-col size-full" role="complementary" aria-label={t(RunsI18nKey.AnalysisDrawerLabel)}>
        <CompareRowDetailPanel
          row={row}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          onClose={onClose}
          displayMode={DetailMode.Drawer}
          onSwitchDisplayMode={onSwitchToSidebar}
        />
      </div>
    </Resizable>,
    document.body,
  );
};

export default CompareRowDetailDrawer;
