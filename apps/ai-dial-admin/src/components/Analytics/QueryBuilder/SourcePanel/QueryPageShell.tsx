'use client';

import { FC, ReactNode } from 'react';

import SourcePanel from '@/src/components/Analytics/QueryBuilder/SourcePanel/SourcePanel';
import { SourcePanelTab } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';

interface Props {
  currentTable?: string;
  currentQueryId?: string;
  children: ReactNode;
}

const QueryPageShell: FC<Props> = ({ currentTable, currentQueryId, children }) => (
  <div className="relative flex min-h-0 w-full flex-1">
    <SourcePanel
      defaultTab={currentQueryId ? SourcePanelTab.Queries : SourcePanelTab.Tables}
      currentTable={currentTable}
      currentQueryId={currentQueryId}
    />
    <div className="flex min-h-0 min-w-0 flex-1 flex-col pl-6">{children}</div>
  </div>
);

export default QueryPageShell;
