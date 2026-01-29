import { FC, useEffect, useState } from 'react';

import { Pod } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { RESTART_REASONS } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';

import LogViewer from '@/src/components/Common/LogViewer/LogViewer';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';

interface Props {
  pod: Pod;
  containerId?: string;
}

const PodView: FC<Props> = ({ pod, containerId }) => {
  const t = useI18n();
  const [logs, setLogs] = useState('');
  const [podData, setPodData] = useState(pod);

  useEffect(() => {
    setPodData(pod);
  }, [pod]);

  const restartReasons = RESTART_REASONS(t);

  useEffect(() => {
    if (containerId) {
      const eventSource = new EventSource(`/api/sse?entity=container&id=${containerId}&podName=${podData.name}`);

      eventSource.addEventListener('logs', (event) => {
        setLogs((prev) => prev + event.data + '\n');
      });

      return () => {
        eventSource?.close();
        setLogs('');
      };
    }
  }, [podData, containerId]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-4">
      {!!podData?.restartCount && (
        <div className="flex gap-10">
          <LabelledText label={t(EntityFieldsI18nKey.Restarts)} text={podData?.restartCount?.toString()} />
          <LabelledText
            label={t(EntityFieldsI18nKey.LastRestartedAt)}
            text={formatDateTimeToLocalString(podData?.lastFinishedAt)}
          />
          <LabelledText
            className="max-w-[350px]"
            label={t(EntityFieldsI18nKey.LastReason)}
            text={restartReasons[podData?.lastTerminationReason as string]}
          />
        </div>
      )}
      <div className="flex flex-1 min-h-0 h-full">
        <LogViewer logs={logs} />
      </div>
    </div>
  );
};

export default PodView;
