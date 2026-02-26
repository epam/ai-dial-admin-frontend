import { FC, useEffect, useState } from 'react';
import LogViewer from '@/src/components/Common/LogViewer/LogViewer';

interface Props {
  imageBuildId?: string;
}

const InstallationLog: FC<Props> = ({ imageBuildId }) => {
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    if (!imageBuildId) return;

    const eventSource = new EventSource(`/api/sse?entity=image&id=${imageBuildId}`);

    const handleLogs = (event: MessageEvent) => {
      if (event.data != null) {
        setLogs((prev) => prev + event.data + '\n');
      }
    };

    const handleStatus = () => {
      eventSource.close();
    };

    const handleError = () => {
      console.error('EventSource error: installation log stream failed');
    };

    eventSource.addEventListener('logs', handleLogs);
    eventSource.addEventListener('status', handleStatus);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('logs', handleLogs);
      eventSource.removeEventListener('status', handleStatus);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [imageBuildId]);

  return (
    <div className="h-full">
      <LogViewer logs={logs} />
    </div>
  );
};

export default InstallationLog;
