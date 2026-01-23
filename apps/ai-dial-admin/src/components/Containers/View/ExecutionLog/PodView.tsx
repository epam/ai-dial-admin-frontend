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

  const restartReasons = RESTART_REASONS(t);

  useEffect(() => {
    if (containerId) {
      const eventSource = new EventSource(`/api/sse?entity=container&id=${containerId}&podName=${pod.name}`);

      eventSource.addEventListener('logs', (event) => {
        setLogs((prev) => prev + event.data + '\n');
      });

      return () => {
        eventSource.close();
      };
    }
  }, [pod, containerId]);

  return (
    <>
      {!!pod.restartCount && (
        <div className="flex gap-4">
          <LabelledText label={t(EntityFieldsI18nKey.Restarts)} text={pod.restartCount?.toString()} />
          <LabelledText
            label={t(EntityFieldsI18nKey.LastRestartedAt)}
            text={formatDateTimeToLocalString(pod.lastFinishedAt)}
          />
          <LabelledText
            label={t(EntityFieldsI18nKey.LastReason)}
            text={restartReasons[pod.lastTerminationReason as string]}
          />
        </div>
      )}
      <div className="h-full mt-3">
        <LogViewer logs={logs} />
      </div>
    </>
  );
};

export default PodView;
