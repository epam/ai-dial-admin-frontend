import { FC, useEffect, useState } from 'react';
import { DeploymentsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';
import { useI18n } from '@/src/locales/client';

import LogViewer from '@/src/components/Common/LogViewer/LogViewer';

interface Props {
  imageBuildId?: string;
}

const InstallationLog: FC<Props> = ({ imageBuildId }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    if (!imageBuildId) return;

    const eventSource = new EventSource(`/api/sse?entity=image&id=${imageBuildId}`);

    const handleLogs = (event: MessageEvent) => {
      if (event.data != null) {
        setLogs((prev) => prev + event.data + '\n');
      }
    };

    const handleError = (event: Event) => {
      const messageEvent = event as MessageEvent;

      if (messageEvent.data == null) {
        eventSource.close();
        return;
      }

      try {
        const { message } = JSON.parse(messageEvent.data);
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
      } catch {
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.LogsError)));
      }
      eventSource.close();
    };

    eventSource.addEventListener('logs', handleLogs);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('logs', handleLogs);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [imageBuildId, showNotification, t]);

  return (
    <div className="h-full">
      <LogViewer logs={logs} />
    </div>
  );
};

export default InstallationLog;
