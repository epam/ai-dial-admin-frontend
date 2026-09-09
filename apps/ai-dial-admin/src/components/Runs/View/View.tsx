'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Grafana from '@/public/images/icons/grafana.svg';
import IconCompare from '@/public/images/icons/difference.svg';
import { IconColumns2, IconFileExport, IconPlayerStop } from '@tabler/icons-react';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';

import { cancelRun } from '@/src/app/[lang]/runs/actions';
import { AdaptiveHeaderActionsConfig } from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import RunCancelModal from '@/src/components/Runs/Cancel/RunCancelModal';
import { useCompareRunLauncher } from '@/src/components/Runs/Compare/useCompareRunLauncher';
import ExportRunModal from '@/src/components/Runs/Export/ExportRunModal';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, BASE_BUTTON_ICON_SIZE } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getRunTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';
import { useRunViewTabState } from './use-run-view-tab-state';

interface Props {
  run: Run;
  onRemove: (id: string) => Promise<ServerActionResponse>;
}

const RunView: FC<Props> = ({ run, onRemove }) => {
  const t = useI18n();
  const { openCompareRun, compareRunModal } = useCompareRunLauncher();

  const [selectedRun, setSelectedRun] = useState<Run>(run);

  const noop = useCallback(() => {}, []);

  const tabs = useMemo(() => getRunTabs(t), [t]);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Summary);
  const tabState = useRunViewTabState(selectedRun.id);
  const { setExtractionResultState } = tabState;
  const showTreePanel = tabState.state.extractionResult.showTreePanel;

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const onOpenExportModal = useCallback(() => setIsExportModalOpen(true), []);
  const onCloseExportModal = useCallback(() => setIsExportModalOpen(false), []);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const onOpenCancelModal = useCallback(() => setIsCancelModalOpen(true), []);
  const onCloseCancelModal = useCallback(() => setIsCancelModalOpen(false), []);

  const onRunCancelled = useCallback(async () => {
    setSelectedRun((prev) => ({
      ...prev,
      status: RunStatus.CANCELLED,
    }));
  }, []);

  const onOpenCompare = useCallback(() => openCompareRun(selectedRun), [openCompareRun, selectedRun]);

  const onChangeActiveTab = useCallback(
    (tab: EntityViewTab) => {
      setActiveTab(tab);
      if (tab !== EntityViewTab.ExtractionResult) {
        setExtractionResultState({ showTreePanel: false });
      }
    },
    [setExtractionResultState],
  );

  const toggleTreePanel = useCallback(
    () => setExtractionResultState({ showTreePanel: !showTreePanel }),
    [setExtractionResultState, showTreePanel],
  );

  const isCompareDisabled = selectedRun.status !== RunStatus.COMPLETED || !selectedRun.testSuiteId;

  const adaptiveActions = useMemo((): AdaptiveHeaderActionsConfig => {
    const leading = selectedRun.grafanaExploreUrl
      ? [
          {
            id: 'grafana',
            label: t(RunsI18nKey.GrafanaRun),
            icon: <Grafana />,
            onClick: () => window.open(selectedRun.grafanaExploreUrl, '_blank'),
            appearance: 'link' as const,
            dividerAfter: true,
          },
        ]
      : [];

    const trailing = [
      ...(selectedRun.status === RunStatus.RUNNING
        ? [
            {
              id: 'stop',
              label: t(ButtonsI18nKey.Stop),
              icon: <IconPlayerStop {...BASE_BUTTON_ICON_PROPS} />,
              onClick: onOpenCancelModal,
              appearance: 'neutral' as const,
            },
          ]
        : []),
      {
        id: 'export',
        label: t(ButtonsI18nKey.Export),
        icon: <IconFileExport {...BASE_BUTTON_ICON_PROPS} />,
        onClick: onOpenExportModal,
        disabled: selectedRun.status !== RunStatus.COMPLETED,
        appearance: 'neutral' as const,
      },
      {
        id: 'compare',
        label: t(ActionMenuOperationI18nKey.Compare),
        icon: (
          <IconCompare width={BASE_BUTTON_ICON_SIZE} height={BASE_BUTTON_ICON_SIZE} className="[&_path]:fill-current" />
        ),
        onClick: onOpenCompare,
        disabled: isCompareDisabled,
        appearance: 'neutral' as const,
      },
    ];

    return { leading, trailing };
  }, [
    selectedRun.grafanaExploreUrl,
    selectedRun.status,
    t,
    onOpenCancelModal,
    onOpenExportModal,
    onOpenCompare,
    isCompareDisabled,
  ]);

  const columnsTabsTrailing =
    activeTab === EntityViewTab.ExtractionResult ? (
      <DialGhostButton
        label={t(ButtonsI18nKey.Columns)}
        iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
        onClick={toggleTreePanel}
      />
    ) : null;

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <SimpleEntityHeader
          view={ApplicationRoute.Runs}
          entity={selectedRun}
          isChanged={false}
          onDiscard={noop}
          onSave={noop}
          onRemove={onRemove}
          tabs={tabs}
          activeTab={activeTab}
          onChangeActiveTab={onChangeActiveTab}
          adaptiveActions={adaptiveActions}
          tabsTrailing={columnsTabsTrailing}
        />

        <div className="flex-1 overflow-auto min-h-0">
          <TabsContent activeTab={activeTab} run={selectedRun} tabState={tabState} />
        </div>
      </div>
      {isExportModalOpen &&
        selectedRun.id &&
        createPortal(<ExportRunModal runId={selectedRun.id} onClose={onCloseExportModal} />, document.body)}
      {isCancelModalOpen &&
        createPortal(
          <RunCancelModal
            run={selectedRun}
            onClose={onCloseCancelModal}
            onCancelRun={cancelRun}
            onSuccess={onRunCancelled}
          />,
          document.body,
        )}
      {compareRunModal}
    </>
  );
};

export default RunView;
