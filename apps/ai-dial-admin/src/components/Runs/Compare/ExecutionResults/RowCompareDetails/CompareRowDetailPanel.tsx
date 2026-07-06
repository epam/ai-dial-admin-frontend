'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import CompareRowDetailDisplayPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailDisplayPanel';
import CompareRowDetailHeader from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailHeader';
import CompareRowDetailPivotTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPivotTable';
import CompareRowDetailTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable';
import { ROW_DETAIL_DISPLAY_PANEL_CLASS } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import { RowDetailViewMode } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import DiffLegend from '@/src/components/Runs/Compare/ExecutionResults/DiffLegend';
import {
  buildRowDetailSections,
  countRowDetailDiffs,
  getCompareRowDetailTitle,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-sections';
import {
  applyRowDetailDisplayTree,
  buildRowDetailDisplayTree,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/utils/row-detail-display-tree';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  displayMode: DetailMode;
  onSwitchDisplayMode: () => void;
  className?: string;
}

const CompareRowDetailPanel: FC<Props> = ({
  row,
  primaryRunName,
  comparedRunName,
  onClose,
  displayMode,
  onSwitchDisplayMode,
  className,
}) => {
  const t = useI18n();
  const [primaryDetail, setPrimaryDetail] = useState<AnalyticsResult | null>(null);
  const [comparedDetail, setComparedDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const [viewMode, setViewMode] = useState(
    displayMode === DetailMode.Drawer ? RowDetailViewMode.Pivot : RowDetailViewMode.Table,
  );
  const [viewDifferencesOnly, setViewDifferencesOnly] = useState(false);
  const [hideHighlights, setHideHighlights] = useState(false);
  const [displayTree, setDisplayTree] = useState<ColDef[]>([]);

  const comparedId = row._compared?.id ?? null;
  const hasComparedMatch = comparedId != null;
  const title = getCompareRowDetailTitle(row);

  useEffect(() => {
    if (!row.id) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setHasError(false);
    setPrimaryDetail(null);
    setComparedDetail(null);

    const primaryPromise = getTestCaseRunResultDetails(row.id);
    const comparedPromise = comparedId ? getTestCaseRunResultDetails(comparedId) : Promise.resolve(null);

    Promise.all([primaryPromise, comparedPromise])
      .then(([primary, compared]) => {
        if (isCancelled) return;
        if (!primary) {
          setHasError(true);
          return;
        }
        setPrimaryDetail(primary);
        setComparedDetail(compared);
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
  }, [row.id, comparedId]);

  const sections = useMemo(() => {
    if (!primaryDetail) return [];
    return buildRowDetailSections(primaryDetail, comparedDetail);
  }, [primaryDetail, comparedDetail]);

  const counts = useMemo(() => countRowDetailDiffs(sections), [sections]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }
    setDisplayTree((prev) => buildRowDetailDisplayTree(sections, prev));
  }, [sections]);

  const displaySections = useMemo(() => applyRowDetailDisplayTree(sections, displayTree), [sections, displayTree]);

  const onToggleDisplayPanel = useCallback(() => setShowDisplayPanel((prev) => !prev), []);
  const onCloseDisplayPanel = useCallback(() => setShowDisplayPanel(false), []);
  const onToggleDiffsOnly = useCallback(() => setViewDifferencesOnly((prev) => !prev), []);

  return (
    <div className={classNames('relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-layer-0', className)}>
      <CompareRowDetailHeader
        title={title}
        onClose={onClose}
        onOpenDisplay={onToggleDisplayPanel}
        isDisplayOpen={showDisplayPanel}
        displayMode={displayMode}
        onSwitchDisplayMode={onSwitchDisplayMode}
      />

      <div className="flex flex-col flex-1 min-h-0 gap-4 px-6 pb-6 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <DialLoader size={40} />
          </div>
        ) : hasError ? (
          <p className="text-secondary dial-small-text">{t(RunsI18nKey.LoadError)}</p>
        ) : (
          <>
            {viewMode === RowDetailViewMode.Table ? (
              <CompareRowDetailTable
                key={row.id}
                sections={displaySections}
                primaryRunName={primaryRunName}
                comparedRunName={comparedRunName}
                hasComparedMatch={hasComparedMatch}
                showDiffsOnly={viewDifferencesOnly}
                onToggleDiffsOnly={onToggleDiffsOnly}
                hideHighlights={hideHighlights}
              />
            ) : (
              <CompareRowDetailPivotTable
                key={row.id}
                sections={displaySections}
                primaryRunName={primaryRunName}
                comparedRunName={comparedRunName}
                hasComparedMatch={hasComparedMatch}
                showDiffsOnly={viewDifferencesOnly}
                hideHighlights={hideHighlights}
              />
            )}
            <DiffLegend counts={counts} className="shrink-0" />
          </>
        )}
      </div>

      {showDisplayPanel && (
        <div className="absolute inset-0 flex bg-blackout z-[15]">
          <CompareRowDetailDisplayPanel
            columns={displayTree}
            onColumnsChange={setDisplayTree}
            onClose={onCloseDisplayPanel}
            panelClassName={ROW_DETAIL_DISPLAY_PANEL_CLASS}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            viewDifferencesOnly={viewDifferencesOnly}
            onViewDifferencesOnlyChange={setViewDifferencesOnly}
            hideHighlights={hideHighlights}
            onHideHighlightsChange={setHideHighlights}
          />
        </div>
      )}
    </div>
  );
};

export default CompareRowDetailPanel;
