'use client';

import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getTestCaseRunResultDetails } from '@/src/app/[lang]/runs/actions';
import CompareRowDetailDisplayPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailDisplayPanel';
import RowDetailHeader from '@/src/components/Runs/Details/RowDetails/RowDetailHeader';
import CompareRowDetailPivotTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPivotTable';
import CompareRowDetailTable from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailTable';
import { DEFAULT_HIDDEN_ROW_DETAIL_FIELDS } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import DiffLegend from '@/src/components/Runs/Compare/ExecutionResults/DiffLegend';
import { ROW_DETAIL_DISPLAY_PANEL_CLASS } from '@/src/components/Runs/Details/RowDetails/constants';
import {
  buildRowDetailSections,
  countRowDetailDiffs,
  getRowDetailTitle,
} from '@/src/components/Runs/Details/RowDetails/utils/row-detail-sections';
import {
  applyRowDetailDisplayTree,
  buildRowDetailDisplayTree,
} from '@/src/components/Runs/Details/RowDetails/utils/row-detail-display-tree';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { createEmptyComparePrimaryRow, getCompareRowSelectionId } from '@/src/components/Runs/View/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult } from '@/src/models/evaluation/run';

interface Props {
  row: CompareAnalyticsRow;
  primaryRunName: string;
  comparedRunName: string;
  onClose: () => void;
  position: SidebarPosition;
  onSwitchDisplayMode: () => void;
  className?: string;
  focusFieldKey?: string | null;
}

const CompareRowDetailPanel: FC<Props> = ({
  row,
  primaryRunName,
  comparedRunName,
  onClose,
  position,
  onSwitchDisplayMode,
  className,
  focusFieldKey,
}) => {
  const t = useI18n();
  const [primaryDetail, setPrimaryDetail] = useState<AnalyticsResult | null>(null);
  const [comparedDetail, setComparedDetail] = useState<AnalyticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const [viewDifferencesOnly, setViewDifferencesOnly] = useState(false);
  const [hideHighlights, setHideHighlights] = useState(false);
  const [displayTree, setDisplayTree] = useState<ColDef[]>([]);

  const isPivotView = position === SidebarPosition.Bottom;
  const comparedId = row._compared?.id ?? null;
  const isComparedOnly = !row.id && comparedId != null;
  const hasComparedMatch = comparedId != null;
  const rowSelectionId = getCompareRowSelectionId(row);
  const title = getRowDetailTitle(row);

  useEffect(() => {
    if (!row.id && !comparedId) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setHasError(false);
    setPrimaryDetail(null);
    setComparedDetail(null);

    const primaryPromise = row.id ? getTestCaseRunResultDetails(row.id) : Promise.resolve(null);
    const comparedPromise = comparedId ? getTestCaseRunResultDetails(comparedId) : Promise.resolve(null);

    Promise.all([primaryPromise, comparedPromise])
      .then(([primary, compared]) => {
        if (isCancelled) return;
        if (isComparedOnly) {
          if (!compared) {
            setHasError(true);
            return;
          }
          setPrimaryDetail(createEmptyComparePrimaryRow(row));
          setComparedDetail(compared);
          return;
        }
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
  }, [row, row.id, comparedId, isComparedOnly]);

  const sections = useMemo(() => {
    if (!primaryDetail) return [];
    return buildRowDetailSections(primaryDetail, comparedDetail);
  }, [primaryDetail, comparedDetail]);

  const counts = useMemo(() => countRowDetailDiffs(sections), [sections]);

  useEffect(() => {
    if (sections.length === 0) {
      return;
    }
    setDisplayTree((prev) => buildRowDetailDisplayTree(sections, prev, DEFAULT_HIDDEN_ROW_DETAIL_FIELDS));
  }, [sections]);

  const displaySections = useMemo(() => applyRowDetailDisplayTree(sections, displayTree), [sections, displayTree]);

  const onToggleDisplayPanel = useCallback(() => setShowDisplayPanel((prev) => !prev), []);
  const onCloseDisplayPanel = useCallback(() => setShowDisplayPanel(false), []);

  return (
    <div className={classNames('relative flex flex-col w-full h-full min-h-0 overflow-hidden bg-layer-0', className)}>
      <RowDetailHeader
        title={title}
        onClose={onClose}
        onOpenDisplay={onToggleDisplayPanel}
        isDisplayOpen={showDisplayPanel}
        position={position}
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
            {isPivotView ? (
              <CompareRowDetailPivotTable
                key={rowSelectionId}
                sections={displaySections}
                primaryRunName={primaryRunName}
                comparedRunName={comparedRunName}
                hasComparedMatch={hasComparedMatch}
                showDiffsOnly={viewDifferencesOnly}
                hideHighlights={hideHighlights}
                focusFieldKey={focusFieldKey}
              />
            ) : (
              <CompareRowDetailTable
                key={rowSelectionId}
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
