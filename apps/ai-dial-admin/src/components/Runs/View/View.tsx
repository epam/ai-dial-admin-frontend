'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import Grafana from '@/public/images/icons/grafana.svg';
import { DialIconButton, DialLabelledText, DialLinkButton, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink, IconFileExport } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import RunStatusComponent from '@/src/components/Common/RunStatus/RunStatus';
import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import ExportRunModal from '@/src/components/Runs/Export/ExportRunModal';
import { ButtonsI18nKey, EntityFieldsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import AnalyticsTab from './Analytics';

interface Props {
  run: Run;
  onRemove: (id: string) => Promise<ServerActionResponse>;
}

const RunView: FC<Props> = ({ run, onRemove }) => {
  const t = useI18n();

  const noop = useCallback(() => {}, []);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const onOpenExportModal = useCallback(() => setIsExportModalOpen(true), []);
  const onCloseExportModal = useCallback(() => setIsExportModalOpen(false), []);

  const headerPostfix = useMemo(() => {
    return (
      <>
        {!!run?.startedAt && (
          <LabelledText label={t(RunsI18nKey.StartTime)} text={formatDateTimeToLocalString(run?.startedAt)} />
        )}
        {!!run?.completedAt && (
          <LabelledText label={t(RunsI18nKey.EndTime)} text={formatDateTimeToLocalString(run?.completedAt)} />
        )}

        {!!run?.status && (
          <LabelledText label={t(EntityFieldsI18nKey.status)}>
            <RunStatusComponent status={run.status} />
          </LabelledText>
        )}
        {!!run?.testRunName && (
          <DialLabelledText
            label={t(RunsI18nKey.TestSuite)}
            text={run.testSuiteId}
            postfix={
              <DialIconButton
                className="text-secondary size-[20px]"
                onClick={() => onOpenInNewTab(ApplicationRoute.TestSuites, { id: run.testSuiteId })}
                icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
              />
            }
          />
        )}
      </>
    );
  }, [run?.completedAt, run?.startedAt, run.status, run.testRunName, run.testSuiteId, t]);

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
        >
          <DialNeutralButton
            label={t(ButtonsI18nKey.Export)}
            iconBefore={<IconFileExport {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onOpenExportModal}
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

        <div className="flex flex-col flex-1 min-h-0">
          <EntityInfoHeader postfix={headerPostfix} view={ApplicationRoute.Runs} />
          <div className="flex-1 min-h-0 mt-8">
            <AnalyticsTab run={run} />
          </div>
        </div>
      </div>
      {isExportModalOpen &&
        run.id &&
        createPortal(<ExportRunModal runId={run.id} onClose={onCloseExportModal} />, document.body)}
    </>
  );
};

export default RunView;
