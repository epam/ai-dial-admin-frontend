'use client';

import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialGhostButton, DialTabs } from '@epam/ai-dial-ui-kit';

import { getRun } from '@/src/app/[lang]/runs/actions';
import CompareRunTag from '@/src/components/Runs/Compare/CompareRunTag';
import CompareTabsContent from '@/src/components/Runs/Compare/CompareTabsContent';
import CompareRowDetailDrawer from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailDrawer';
import CompareRowDetailPanel from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/CompareRowDetailPanel';
import { ROW_DETAIL_SIDEBAR_CLASS } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import { DetailMode } from '@/src/components/Runs/Details/BottomDrawer/models';
import {
  CompareRunSlot,
  CompareViewTab,
  RUN_COMPARE_PRIMARY_INDEX,
  RUN_COMPARE_SECONDARY_INDEX,
} from '@/src/components/Runs/Compare/constants';
import SelectCompareRunModal from '@/src/components/Runs/Compare/SelectCompareRunModal';
import {
  fetchSuiteCompletedRuns,
  getCompareRunsUrn,
  getCompareViewTabs,
  getSelectableCompareRuns,
} from '@/src/components/Runs/Compare/utils';
import { CompareAnalyticsRow } from '@/src/components/Runs/View/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

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

  const [primaryRunId, setPrimaryRunId] = useState(runId);
  const [run, setRun] = useState<Run | null>(null);
  const [suiteRuns, setSuiteRuns] = useState<Run[]>([]);
  const [selectRunSlot, setSelectRunSlot] = useState<CompareRunSlot | null>(null);
  const [comparedRunId, setComparedRunId] = useState(comparedRunIdProp);
  const [activeTab, setActiveTab] = useState(CompareViewTab.ExecutionResults);
  const [showDisplayPanel, setShowDisplayPanel] = useState(false);
  const [selectedRow, setSelectedRow] = useState<CompareAnalyticsRow | null>(null);
  const [detailMode, setDetailMode] = useState(DetailMode.Sidebar);

  const compareTabs = useMemo(() => getCompareViewTabs(t), [t]);

  const selectRunModalConfig = useMemo(() => {
    if (!selectRunSlot) return null;

    return {
      runs: getSelectableCompareRuns(suiteRuns, selectRunSlot, run?.id, comparedRunId),
      selectedRunId: selectRunSlot === CompareRunSlot.Primary ? run?.id : comparedRunId,
    };
  }, [selectRunSlot, suiteRuns, run?.id, comparedRunId]);

  const isPrimaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Primary, run?.id, comparedRunId).length <= 1,
    [suiteRuns, run?.id, comparedRunId],
  );

  const isSecondaryEditDisabled = useMemo(
    () => getSelectableCompareRuns(suiteRuns, CompareRunSlot.Secondary, run?.id, comparedRunId).length <= 1,
    [suiteRuns, run?.id, comparedRunId],
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

    fetchSuiteCompletedRuns(run.testSuiteId).then((runs) => {
      setSuiteRuns(runs);
    });
  }, [run?.testSuiteId]);

  const primaryRunName = run?.testRunName || primaryRunId;
  const comparedRun = suiteRuns.find((suiteRun) => suiteRun.id === comparedRunId);
  const comparedRunName = comparedRun?.testRunName || comparedRunId;

  const openSelectRun = (slot: CompareRunSlot) => setSelectRunSlot(slot);
  const closeSelectRun = () => setSelectRunSlot(null);

  const onApplySelectRun = useCallback(
    (selectedRunId: string) => {
      if (!selectRunSlot) return;

      let newPrimary = primaryRunId;
      let newSecondary = comparedRunId;

      if (selectRunSlot === CompareRunSlot.Primary) {
        newPrimary = selectedRunId;
        if (selectedRunId === comparedRunId) {
          newSecondary = primaryRunId;
          setComparedRunId(newSecondary);
        }
        setPrimaryRunId(newPrimary);
      } else {
        newSecondary = selectedRunId;
        setComparedRunId(newSecondary);
      }

      router.replace(getCompareRunsUrn(newPrimary, newSecondary), { scroll: false });
      setSelectRunSlot(null);
    },
    [selectRunSlot, comparedRunId, primaryRunId, router],
  );

  const onChangeActiveTab = useCallback((tab: string) => {
    setActiveTab(tab as CompareViewTab);
  }, []);

  const toggleDisplayPanel = useCallback(() => setShowDisplayPanel((prev) => !prev), []);

  const closeRowDetail = useCallback(() => {
    setSelectedRow(null);
    setDetailMode(DetailMode.Sidebar);
    sidebarRef.current.closeSidebar();
  }, []);

  const switchToDrawer = useCallback(() => {
    sidebarRef.current.closeSidebar();
    setDetailMode(DetailMode.Drawer);
  }, []);

  const showSidebarPanel = useCallback(
    (row: CompareAnalyticsRow) => {
      sidebarRef.current.showSidebar(
        <CompareRowDetailPanel
          row={row}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          onClose={closeRowDetail}
          displayMode={DetailMode.Sidebar}
          onSwitchDisplayMode={switchToDrawer}
        />,
        ROW_DETAIL_SIDEBAR_CLASS,
      );
    },
    [primaryRunName, comparedRunName, closeRowDetail, switchToDrawer],
  );

  const switchToSidebar = useCallback(() => {
    setDetailMode(DetailMode.Sidebar);
    const currentRow = selectedRow;
    if (currentRow) {
      // Let the drawer unmount before re-showing the sidebar panel.
      setTimeout(() => showSidebarPanel(currentRow), 0);
    }
  }, [selectedRow, showSidebarPanel]);

  const openRowDetail = useCallback(
    (row: CompareAnalyticsRow) => {
      if (selectedRow?.id === row.id) {
        closeRowDetail();
        return;
      }
      setSelectedRow(row);
      if (detailMode === DetailMode.Sidebar) {
        showSidebarPanel(row);
      }
    },
    [selectedRow?.id, detailMode, closeRowDetail, showSidebarPanel],
  );

  useEffect(() => {
    if (activeTab !== CompareViewTab.ExecutionResults) {
      setShowDisplayPanel(false);
      closeRowDetail();
    }
  }, [activeTab, closeRowDetail]);

  useEffect(() => {
    closeRowDetail();
  }, [primaryRunId, comparedRunId, closeRowDetail]);

  useEffect(() => () => sidebarRef.current.closeSidebar(), []);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-layer-2 rounded overflow-hidden p-4 gap-4">
      <h3 className="dial-h3 text-primary shrink-0">{t(RunsI18nKey.RunComparison)}</h3>

      <div className="flex items-center gap-2 shrink-0">
        {run && (
          <CompareRunTag
            runIndex={RUN_COMPARE_PRIMARY_INDEX}
            name={primaryRunName}
            onEdit={() => openSelectRun(CompareRunSlot.Primary)}
            isEditDisabled={isPrimaryEditDisabled}
          />
        )}
        <span className="text-secondary dial-small-text">{t(RunsI18nKey.RunCompareVs)}</span>
        <CompareRunTag
          runIndex={RUN_COMPARE_SECONDARY_INDEX}
          name={comparedRunName}
          onEdit={() => openSelectRun(CompareRunSlot.Secondary)}
          isEditDisabled={isSecondaryEditDisabled}
        />
      </div>

      <div className="flex items-center justify-between gap-4 shrink-0">
        <DialTabs tabs={compareTabs} activeTab={activeTab} onClick={onChangeActiveTab} />
        {activeTab === CompareViewTab.ExecutionResults && (
          <DialGhostButton
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
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          showDisplayPanel={showDisplayPanel}
          onToggleDisplayPanel={toggleDisplayPanel}
          selectedRow={selectedRow}
          onOpenRowDetail={openRowDetail}
          onCloseRowDetail={closeRowDetail}
        />
      </div>

      {detailMode === DetailMode.Drawer && selectedRow && (
        <CompareRowDetailDrawer
          row={selectedRow}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          onClose={closeRowDetail}
          onSwitchToSidebar={switchToSidebar}
        />
      )}

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
