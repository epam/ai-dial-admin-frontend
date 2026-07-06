'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Grafana from '@/public/images/icons/grafana.svg';
import { DialLinkButton, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconFileExport } from '@tabler/icons-react';

import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import ExportRunModal from '@/src/components/Runs/Export/ExportRunModal';
import { ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getRunTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  run: Run;
  onRemove: (id: string) => Promise<ServerActionResponse>;
}

const RunView: FC<Props> = ({ run, onRemove }) => {
  const t = useI18n();

  const noop = useCallback(() => {}, []);

  const tabs = useMemo(() => getRunTabs(t), [t]);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Summary);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const onOpenExportModal = useCallback(() => setIsExportModalOpen(true), []);
  const onCloseExportModal = useCallback(() => setIsExportModalOpen(false), []);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <SimpleEntityHeader
          view={ApplicationRoute.Runs}
          entity={run}
          isChanged={false}
          onDiscard={noop}
          onSave={noop}
          onRemove={onRemove}
          tabs={tabs}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
        >
          <DialNeutralButton
            label={t(ButtonsI18nKey.Export)}
            iconBefore={<IconFileExport {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onOpenExportModal}
            disabled={run.status === RunStatus.RUNNING}
          />
          {run.grafanaExploreUrl && (
            <div className="flex items-center">
              <div className="w-px h-6 bg-layer-4" />
              <DialLinkButton
                iconBefore={<Grafana />}
                label={t(RunsI18nKey.GrafanaRun)}
                onClick={() => window.open(run.grafanaExploreUrl, '_blank')}
              />
            </div>
          )}
        </SimpleEntityHeader>

        <div className="flex-1 overflow-auto min-h-0">
          <TabsContent activeTab={activeTab} run={run} />
        </div>
      </div>
      {isExportModalOpen &&
        run.id &&
        createPortal(<ExportRunModal runId={run.id} onClose={onCloseExportModal} />, document.body)}
    </>
  );
};

export default RunView;
