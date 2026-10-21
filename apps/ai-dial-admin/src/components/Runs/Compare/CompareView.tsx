'use client';

import { IconAdjustmentsHorizontal, IconArrowsLeftRight } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { GhostButton, GhostIconButton, DialSwitch, DialTabs, ElementSize } from '@epam/ai-dial-ui-kit';

import { getRun } from '@/src/app/[lang]/runs/actions';
import CompareRunTag from '@/src/components/Runs/Compare/CompareRunTag';
import CompareTabsContent from '@/src/components/Runs/Compare/CompareTabsContent';
import CompareRowDetailBottomPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailBottomPanel';
import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { deriveCompareGridColDefs } from '@/src/components/Runs/Compare/ExecutionResults/utils/panel-columns';
import { ROW_DETAIL_BOTTOM_CLASS, ROW_DETAIL_SIDEBAR_CLASS } from '@/src/components/Runs/Details/RowDetails/constants';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { CompareRunSlot, CompareViewTab } from '@/src/components/Runs/Compare/constants';
import HeatMapToolbar from '@/src/components/Runs/Compare/HeatMap/HeatMapToolbar';
import { HeatMapColorDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { resolveMetricGroupsSelection } from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-metric-selection';
import { CompareCandidateRun } from '@/src/components/Runs/Compare/models';
import SelectCompareRunModal from '@/src/components/Runs/Compare/SelectCompareRunModal';
import { useCompareViewTabState } from '@/src/components/Runs/Compare/use-compare-view-tab-state';
import {
  fetchCompareCandidateRuns,
  getCompareRunsUrn,
  getCompareViewTabs,
  getCompareRuns,
  getSelectableCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import {
  getMetricGroupOrder,
  getRowDetailFieldSchema,
  isMatchedCompareRow,
  mergeByTestCaseId,
} from '@/src/components/Runs/View/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsResult, Run } from '@/src/models/evaluation/run';

interface Props {
  runId: string;
  comparedRunId: string;
}

const CompareView: FC<Props> = ({ runId, comparedRunId: comparedRunIdProp }) => {
  const t = useI18n();
  const router = useRouter();
  const { sidebar } = useAppContext();

  const sidebarRef = useRef(sidebar);
  sidebarRef.current = sidebar;

  const showDetailPanelRef = useRef<
    (row: CompareAnalyticsRow, position: SidebarPosition, fieldKey?: string | null, focusRequestId?: number) => void
  >(() => {});
  const focusRequestIdRef = useRef(0);

  const [primaryRunId, setPrimaryRunId] = useState(runId);
  const [run, setRun] = useState<Run | null>(null);
  const [suiteRuns, setSuiteRuns] = useState<CompareCandidateRun[]>([]);
  const [runNames, setRunNames] = useState<Record<string, string>>({});
  const [selectRunSlot, setSelectRunSlot] = useState<CompareRunSlot | null>(null);
  const [comparedRunId, setComparedRunId] = useState(comparedRunIdProp);
  const [activeTab, setActiveTab] = useState(CompareViewTab.SummaryOverview);
  const [onlyMatchingTestCases, setOnlyMatchingTestCases] = useState(false);
  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CompareAnalyticsRow | null>(null);
  const [detailPosition, setDetailPosition] = useState(SidebarPosition.Bottom);
  const [focusFieldKey, setFocusFieldKey] = useState<string | null>(null);
  const [colorDisplayMode, setColorDisplayMode] = useState(HeatMapColorDisplayMode.Absolute);
  const [availableMetricGroups, setAvailableMetricGroups] = useState<string[]>([]);
  const [selectedMetricGroups, setSelectedMetricGroups] = useState<Set<string>>(new Set());
  const areMetricGroupsInitializedRef = useRef(false);
  const displayTreeRef = useRef<ColDef[]>([]);
  const viewDifferencesOnlyRef = useRef(false);
  const hideHighlightsRef = useRef(false);

  const {
    state: tabState,
    setExecutionResultsState,
    setHeatMapState,
    setSummaryState,
  } = useCompareViewTabState(primaryRunId, comparedRunId);

  const selectedRowRef = useRef(selectedRow);
  selectedRowRef.current = selectedRow;
  const focusFieldKeyRef = useRef(focusFieldKey);
  focusFieldKeyRef.current = focusFieldKey;
  const detailPositionRef = useRef(detailPosition);
  detailPositionRef.current = detailPosition;

  const compareTabs = useMemo(() => getCompareViewTabs(t), [t]);
  const fieldSchema = useMemo(() => {
    const primary = tabState.executionResults.results ?? [];
    const compared = tabState.executionResults.comparedResults ?? [];
    const merged = mergeByTestCaseId(primary, compared);
    const allResults: AnalyticsResult[] = [
      ...merged,
      ...merged.flatMap((row) => (row._compared ? [row._compared] : [])),
    ];
    return getRowDetailFieldSchema(allResults);
  }, [tabState.executionResults.results, tabState.executionResults.comparedResults]);
  const metricGroupOrder = useMemo(
    () =>
      getMetricGroupOrder(
        deriveCompareGridColDefs(tabState.executionResults.panelColDefs, tabState.executionResults.columnState),
      ),
    [tabState.executionResults.panelColDefs, tabState.executionResults.columnState],
  );

  const selectRunModalConfig = useMemo(() => {
    if (!selectRunSlot) return null;

    return {
      runs: getSelectableCompareRuns(suiteRuns, selectRunSlot, primaryRunId, comparedRunId),
      selectedRunId: selectRunSlot === CompareRunSlot.Primary ? primaryRunId : comparedRunId,
    };
  }, [selectRunSlot, suiteRuns, primaryRunId, comparedRunId]);

  const isPrimaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Primary, primaryRunId, comparedRunId).length <= 1,
    [suiteRuns, primaryRunId, comparedRunId],
  );

  const isSecondaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Secondary, primaryRunId, comparedRunId).length <= 1,
    [suiteRuns, primaryRunId, comparedRunId],
  );

  useEffect(() => {
    setPrimaryRunId((current) => (current === runId ? current : runId));
  }, [runId]);

  useEffect(() => {
    setComparedRunId((current) => (current === comparedRunIdProp ? current : comparedRunIdProp));
  }, [comparedRunIdProp]);

  useEffect(() => {
    let isCancelled = false;

    setRun(null);

    getRun(primaryRunId)
      .then((runData) => {
        if (!isCancelled && runData) {
          setRun(runData);
        }
      })
      .catch(() => {
        // ExecutionResultsTab handles load errors for compare data
      });

    return () => {
      isCancelled = true;
    };
  }, [primaryRunId]);

  useEffect(() => {
    if (!run?.testSuiteId) return;

    fetchCompareCandidateRuns(run.testSuiteId).then((runs) => {
      setSuiteRuns(runs);
    });
  }, [run?.testSuiteId]);

  // Names learned from either source are kept by id, so a run keeps its name when it changes slot
  // (flip) while the run being loaded for its slot is still pending. Until a name is known the id shows.
  useEffect(() => {
    const namedRuns = [...(run ? [run] : []), ...suiteRuns].filter((item) => item.testRunName);
    if (namedRuns.length === 0) return;

    setRunNames((current) => ({
      ...current,
      ...Object.fromEntries(namedRuns.map((item) => [item.id, item.testRunName])),
    }));
  }, [run, suiteRuns]);

  const primaryRunName = runNames[primaryRunId] || primaryRunId;
  const comparedRunName = runNames[comparedRunId] || comparedRunId;
  const runs = useMemo(
    () => getCompareRuns({ id: primaryRunId, name: primaryRunName }, { id: comparedRunId, name: comparedRunName }),
    [primaryRunId, primaryRunName, comparedRunId, comparedRunName],
  );
  const isEditDisabledBySlot: Record<CompareRunSlot, boolean> = {
    [CompareRunSlot.Primary]: isPrimaryEditDisabled,
    [CompareRunSlot.Secondary]: isSecondaryEditDisabled,
  };

  const openSelectRun = (slot: CompareRunSlot) => setSelectRunSlot(slot);
  const closeSelectRun = () => setSelectRunSlot(null);

  const applyRunPair = useCallback(
    (newPrimary: string, newSecondary: string) => {
      setPrimaryRunId(newPrimary);
      setComparedRunId(newSecondary);
      router.replace(getCompareRunsUrn(newPrimary, newSecondary), { scroll: false });
    },
    [router],
  );

  const onApplySelectRun = useCallback(
    (selectedRunId: string) => {
      if (!selectRunSlot) return;

      if (selectRunSlot === CompareRunSlot.Primary) {
        const isSwap = selectedRunId === comparedRunId;
        applyRunPair(selectedRunId, isSwap ? primaryRunId : comparedRunId);
      } else {
        applyRunPair(primaryRunId, selectedRunId);
      }

      setSelectRunSlot(null);
    },
    [selectRunSlot, comparedRunId, primaryRunId, applyRunPair],
  );

  const onFlipRuns = useCallback(() => {
    applyRunPair(comparedRunId, primaryRunId);
  }, [applyRunPair, comparedRunId, primaryRunId]);

  const onChangeActiveTab = useCallback((tab: string) => {
    setActiveTab(tab as CompareViewTab);
  }, []);

  const toggleDisplayPanel = useCallback(() => setShowDisplayPanel((prev) => !prev), []);

  const onColorDisplayModeChange = useCallback((mode: HeatMapColorDisplayMode) => {
    setColorDisplayMode(mode);
  }, []);

  const onAvailableMetricGroupsChange = useCallback((groups: string[]) => {
    setAvailableMetricGroups(groups);
    setSelectedMetricGroups((prev) => {
      const resolved = resolveMetricGroupsSelection(groups, prev, areMetricGroupsInitializedRef.current);
      areMetricGroupsInitializedRef.current = resolved.isInitialized;
      return resolved.selection;
    });
  }, []);

  const onSelectedMetricGroupsChange = useCallback((groups: Set<string>) => {
    setSelectedMetricGroups(groups);
  }, []);

  const persistDisplayTree = useCallback((tree: ColDef[]) => {
    displayTreeRef.current = tree;
  }, []);
  const persistViewDifferencesOnly = useCallback((value: boolean) => {
    viewDifferencesOnlyRef.current = value;
  }, []);
  const persistHideHighlights = useCallback((value: boolean) => {
    hideHighlightsRef.current = value;
  }, []);

  const closeRowDetail = useCallback(() => {
    setSelectedRow(null);
    setFocusFieldKey(null);
    sidebarRef.current.closeSidebar();
  }, []);

  const switchToBottom = useCallback(() => {
    setDetailPosition(SidebarPosition.Bottom);
    const currentRow = selectedRowRef.current;
    if (currentRow) {
      showDetailPanelRef.current(
        currentRow,
        SidebarPosition.Bottom,
        focusFieldKeyRef.current,
        focusRequestIdRef.current,
      );
    }
  }, []);

  const switchToSidebar = useCallback(() => {
    setDetailPosition(SidebarPosition.Right);
    const currentRow = selectedRowRef.current;
    if (currentRow) {
      showDetailPanelRef.current(
        currentRow,
        SidebarPosition.Right,
        focusFieldKeyRef.current,
        focusRequestIdRef.current,
      );
    }
  }, []);

  const showDetailPanel = useCallback(
    (row: CompareAnalyticsRow, position: SidebarPosition, fieldKey: string | null = null, focusRequestId = 0) => {
      const isBottom = position === SidebarPosition.Bottom;
      const content = isBottom ? (
        <CompareRowDetailBottomPanel
          row={row}
          runs={runs}
          onClose={closeRowDetail}
          onSwitchToSidebar={switchToSidebar}
          focusFieldKey={fieldKey}
          focusRequestId={focusRequestId}
          fieldSchema={fieldSchema}
          metricGroupOrder={metricGroupOrder}
          initialDisplayTree={displayTreeRef.current}
          onDisplayTreeChange={persistDisplayTree}
          initialViewDifferencesOnly={viewDifferencesOnlyRef.current}
          onViewDifferencesOnlyChange={persistViewDifferencesOnly}
          initialHideHighlights={hideHighlightsRef.current}
          onHideHighlightsChange={persistHideHighlights}
        />
      ) : (
        <CompareRowDetailPanel
          row={row}
          runs={runs}
          onClose={closeRowDetail}
          position={SidebarPosition.Right}
          onSwitchDisplayMode={switchToBottom}
          focusFieldKey={fieldKey}
          focusRequestId={focusRequestId}
          fieldSchema={fieldSchema}
          metricGroupOrder={metricGroupOrder}
          initialDisplayTree={displayTreeRef.current}
          onDisplayTreeChange={persistDisplayTree}
          initialViewDifferencesOnly={viewDifferencesOnlyRef.current}
          onViewDifferencesOnlyChange={persistViewDifferencesOnly}
          initialHideHighlights={hideHighlightsRef.current}
          onHideHighlightsChange={persistHideHighlights}
        />
      );
      const className = isBottom ? ROW_DETAIL_BOTTOM_CLASS : ROW_DETAIL_SIDEBAR_CLASS;
      sidebarRef.current.showSidebar(content, className, position);
    },
    [
      runs,
      closeRowDetail,
      switchToBottom,
      switchToSidebar,
      fieldSchema,
      metricGroupOrder,
      persistDisplayTree,
      persistViewDifferencesOnly,
      persistHideHighlights,
    ],
  );

  showDetailPanelRef.current = showDetailPanel;

  const openRowDetail = useCallback(
    (row: CompareAnalyticsRow, options?: { focusFieldKey?: string | null }) => {
      const fieldKey = options?.focusFieldKey ?? null;
      focusRequestIdRef.current += 1;

      setSelectedRow(row);
      setFocusFieldKey(fieldKey);
      showDetailPanel(row, detailPosition, fieldKey, focusRequestIdRef.current);
    },
    [showDetailPanel, detailPosition],
  );

  useEffect(() => {
    const currentRow = selectedRowRef.current;
    if (currentRow) {
      showDetailPanelRef.current(
        currentRow,
        detailPositionRef.current,
        focusFieldKeyRef.current,
        focusRequestIdRef.current,
      );
    }
  }, [runs]);

  useEffect(() => {
    if (activeTab !== CompareViewTab.ExecutionResults) {
      setShowDisplayPanel(false);
      closeRowDetail();
    }
  }, [activeTab, closeRowDetail]);

  useEffect(() => {
    closeRowDetail();
    displayTreeRef.current = [];
    viewDifferencesOnlyRef.current = false;
    hideHighlightsRef.current = false;
    setAvailableMetricGroups([]);
    setSelectedMetricGroups(new Set());
    areMetricGroupsInitializedRef.current = false;
    setOnlyMatchingTestCases(false);
  }, [primaryRunId, comparedRunId, closeRowDetail]);

  useEffect(() => {
    if (!onlyMatchingTestCases || !selectedRow) {
      return;
    }
    if (!isMatchedCompareRow(selectedRow)) {
      closeRowDetail();
    }
  }, [onlyMatchingTestCases, selectedRow, closeRowDetail]);

  useEffect(() => () => sidebarRef.current.closeSidebar(), []);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-layer-2 rounded overflow-hidden p-4 gap-4">
      <h3 className="dial-h3 text-primary shrink-0">{t(RunsI18nKey.RunComparison)}</h3>

      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {runs.map((compareRun, position) => (
            <Fragment key={compareRun.slot}>
              {position > 0 && (
                <GhostIconButton
                  size={ElementSize.Small}
                  icon={<IconArrowsLeftRight size={16} aria-hidden />}
                  aria-label={t(RunsI18nKey.RunCompareFlip)}
                  title={t(RunsI18nKey.RunCompareFlip)}
                  onClick={onFlipRuns}
                />
              )}
              <CompareRunTag
                run={compareRun}
                onEdit={() => openSelectRun(compareRun.slot)}
                isEditDisabled={isEditDisabledBySlot[compareRun.slot]}
              />
            </Fragment>
          ))}
        </div>
        <DialSwitch
          switchId="onlyMatchingTestCases"
          isOn={onlyMatchingTestCases}
          label={t(RunsI18nKey.OnlyMatchingTestCases)}
          onChange={setOnlyMatchingTestCases}
        />
      </div>

      <div className="flex items-center justify-between gap-4 shrink-0">
        <DialTabs tabs={compareTabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        {activeTab === CompareViewTab.HeatMap && (
          <HeatMapToolbar
            availableMetricGroups={availableMetricGroups}
            selectedMetricGroups={selectedMetricGroups}
            onSelectedMetricGroupsChange={onSelectedMetricGroupsChange}
            colorDisplayMode={colorDisplayMode}
            onColorDisplayModeChange={onColorDisplayModeChange}
          />
        )}
        {activeTab === CompareViewTab.ExecutionResults && (
          <GhostButton
            label={t(RunsI18nKey.RunCompareDisplay)}
            iconBefore={<IconAdjustmentsHorizontal {...BASE_BUTTON_ICON_PROPS} />}
            onClick={toggleDisplayPanel}
          />
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <CompareTabsContent
          activeTab={activeTab}
          primaryRunId={primaryRunId}
          comparedRunId={comparedRunId}
          runs={runs}
          onlyMatchingTestCases={onlyMatchingTestCases}
          colorDisplayMode={colorDisplayMode}
          onColorDisplayModeChange={onColorDisplayModeChange}
          selectedMetricGroups={selectedMetricGroups}
          onAvailableMetricGroupsChange={onAvailableMetricGroupsChange}
          showDisplayPanel={showDisplayPanel}
          onToggleDisplayPanel={toggleDisplayPanel}
          selectedRow={selectedRow}
          onOpenRowDetail={openRowDetail}
          onCloseRowDetail={closeRowDetail}
          executionResultsState={tabState.executionResults}
          setExecutionResultsState={setExecutionResultsState}
          heatMapState={tabState.heatMap}
          setHeatMapState={setHeatMapState}
          summaryState={tabState.summary}
          setSummaryState={setSummaryState}
        />
      </div>

      {selectRunModalConfig &&
        createPortal(
          <SelectCompareRunModal
            isModalOpen
            runs={selectRunModalConfig.runs}
            selectedRunId={selectRunModalConfig.selectedRunId}
            onClose={closeSelectRun}
            onApply={onApplySelectRun}
          />,
          document.body,
        )}
    </div>
  );
};

export default CompareView;
