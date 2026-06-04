import { FC, useEffect, useState } from 'react';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ApiRoute } from '@/src/constants/api-routes';
import { Pod } from '@/src/models/deployments/containers';
import { ErrorI18nKey, EntityFieldsI18nKey, DeploymentsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { RESTART_REASONS } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';
import { getTranslatedDeploymentType } from '@/src/utils/deployments/entity';

import LogViewer from '@/src/components/Common/LogViewer/LogViewer';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  pod: Pod;
  containerId?: string;
  route: ApplicationRoute;
}

const PodView: FC<Props> = ({ pod, containerId, route }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState('');
  const [podData, setPodData] = useState(pod);

  useEffect(() => {
    setPodData(pod);
  }, [pod]);

  const restartReasons = RESTART_REASONS(t);

  const hasPodStatus = !!podData?.restartCount || !!podData?.lastTerminationMessage;

  useEffect(() => {
    if (!containerId || !podData?.name) return;

    const eventSource = new EventSource(`${ApiRoute.Sse}?entity=container&id=${containerId}&podName=${podData.name}`);

    const handleLogs = (event: MessageEvent) => {
      setLogs((prev) => prev + event.data + '\n');
    };

    const handleError = (event: Event) => {
      const messageEvent = event as MessageEvent;
      if (typeof messageEvent.data === 'string') {
        try {
          const { message } = JSON.parse(messageEvent.data);
          showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
          eventSource.close();
          return;
        } catch {
          // not a server-sent error — fall through to readyState gate
        }
      }
      if (eventSource.readyState === EventSource.CLOSED) {
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.LogsError)));
      }
    };

    // Backend re-streams the full pod log on every (re)connect via fabric8 watchLog().
    // Clear the buffer on each open to avoid duplication; the next open will refill from the start.
    const handleOpen = () => {
      setLogs('');
    };

    eventSource.addEventListener('logs', handleLogs);
    eventSource.addEventListener('error', handleError);
    eventSource.addEventListener('open', handleOpen);

    return () => {
      eventSource.removeEventListener('logs', handleLogs);
      eventSource.removeEventListener('error', handleError);
      eventSource.removeEventListener('open', handleOpen);
      eventSource.close();
    };
  }, [containerId, podData.name, showNotification, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full gap-4">
      {hasPodStatus && (
        <div className="flex flex-col gap-2">
          {!!podData?.restartCount && (
            <div className="flex gap-10">
              {!!podData?.restartCount && (
                <LabelledText label={t(EntityFieldsI18nKey.Restarts)} text={podData?.restartCount?.toString()} />
              )}
              {!!podData?.lastFinishedAt && (
                <LabelledText
                  label={t(EntityFieldsI18nKey.LastRestartedAt)}
                  text={formatDateTimeToLocalString(podData?.lastFinishedAt)}
                />
              )}
              {!!podData?.lastTerminationReason && (
                <LabelledText
                  className="max-w-[350px]"
                  label={t(EntityFieldsI18nKey.LastReason)}
                  text={restartReasons[podData?.lastTerminationReason as string]}
                />
              )}
            </div>
          )}
          {!!podData?.lastTerminationMessage && (
            <LabelledText
              className="max-w-full"
              label={t(EntityFieldsI18nKey.TerminationMessage)}
              text={podData.lastTerminationMessage}
              tooltip={podData.lastTerminationMessage}
            />
          )}
        </div>
      )}
      <div className="flex flex-1 min-h-0 h-full">
        {logs.length ? (
          <LogViewer logs={logs} />
        ) : (
          <DialNoDataContent
            title={t(EntitiesI18nKey.NoContainerLogs, { entityType: getTranslatedDeploymentType(route, t) })}
          />
        )}
      </div>
    </div>
  );
};

export default PodView;
