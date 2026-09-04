'use client';

import { FC } from 'react';

import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  onSwitchToSidebar: () => void;
  focusFieldKey?: string | null;
}

const CompareRowDetailBottomPanel: FC<Props> = ({
  row,
  primaryRunName,
  comparedRunName,
  onClose,
  onSwitchToSidebar,
  focusFieldKey,
}) => {
  return (
    <div className="flex flex-col size-full bg-layer-0 overflow-hidden">
      <CompareRowDetailPanel
        row={row}
        primaryRunName={primaryRunName}
        comparedRunName={comparedRunName}
        onClose={onClose}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={onSwitchToSidebar}
        focusFieldKey={focusFieldKey}
      />
    </div>
  );
};

export default CompareRowDetailBottomPanel;
