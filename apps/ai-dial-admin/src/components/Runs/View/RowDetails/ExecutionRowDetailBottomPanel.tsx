'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import RowDetailHeader from '@/src/components/Runs/Details/RowDetails/RowDetailHeader';
import {
  EXECUTION_RESULT_DEFAULT_HIDDEN_FIELDS,
  ROW_DETAIL_DISPLAY_PANEL_CLASS,
} from '@/src/components/Runs/Details/RowDetails/constants';
import {
  applyRowDetailDisplayTree,
  buildRowDetailDisplayTree,
} from '@/src/components/Runs/Details/RowDetails/utils/row-detail-display-tree';
import {
  buildRowDetailSections,
  getRowDetailTitle,
} from '@/src/components/Runs/Details/RowDetails/utils/row-detail-sections';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import ExecutionRowDetailDisplayPanel from '@/src/components/Runs/View/RowDetails/ExecutionRowDetailDisplayPanel';
import ExecutionRowDetailPivotTable from '@/src/components/Runs/View/RowDetails/ExecutionRowDetailPivotTable';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  resultId: string;
  onClose: () => void;
  onSwitchToSidebar: () => void;
  focusFieldKey?: string | null;
  className?: string;
}

const ExecutionRowDetailBottomPanel: FC<Props> = ({
  resultId,
  onClose,
  onSwitchToSidebar,
  focusFieldKey,
  className,
}) => {
  const t = useI18n();
  const [detail, setDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const [displayTree, setDisplayTree] = useState<ColDef[]>([]);

  useEffect(() => {
    let isCancelled = false;

    setIsLoading(true);
    setHasError(false);
    setDetail(null);

    getTestCaseRunResultDetails(resultId)
      .then((res) => {
        if (isCancelled) return;
        if (!res) {
          setHasError(true);
          return;
        }
        setDetail(res);
      })
      .catch(() => {
        if (!isCancelled) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [resultId]);

  const sections = useMemo(() => {
    if (!detail) return [];
    return buildRowDetailSections(detail, null);
  }, [detail]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }
    setDisplayTree((prev) => buildRowDetailDisplayTree(sections, prev, EXECUTION_RESULT_DEFAULT_HIDDEN_FIELDS));
  }, [sections]);

  const displaySections = useMemo(() => applyRowDetailDisplayTree(sections, displayTree), [sections, displayTree]);

  const title = useMemo(() => (detail ? getRowDetailTitle(detail) : null), [detail]);

  const onToggleDisplayPanel = useCallback(() => setShowDisplayPanel((prev) => !prev), []);
  const onCloseDisplayPanel = useCallback(() => setShowDisplayPanel(false), []);

  return (
    <div className={classNames('relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-layer-0', className)}>
      <RowDetailHeader
        title={title ?? ''}
        onClose={onClose}
        onOpenDisplay={onToggleDisplayPanel}
        isDisplayOpen={showDisplayPanel}
        position={SidebarPosition.Bottom}
        onSwitchDisplayMode={onSwitchToSidebar}
      />

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-6 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <DialLoader size={40} />
          </div>
        ) : hasError ? (
          <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>
        ) : (
          <ExecutionRowDetailPivotTable key={resultId} sections={displaySections} focusFieldKey={focusFieldKey} />
        )}
      </div>

      {showDisplayPanel && (
        <div className="absolute inset-0 flex bg-blackout z-[15]">
          <ExecutionRowDetailDisplayPanel
            columns={displayTree}
            onColumnsChange={setDisplayTree}
            onClose={onCloseDisplayPanel}
            panelClassName={ROW_DETAIL_DISPLAY_PANEL_CLASS}
          />
        </div>
      )}
    </div>
  );
};

export default ExecutionRowDetailBottomPanel;
