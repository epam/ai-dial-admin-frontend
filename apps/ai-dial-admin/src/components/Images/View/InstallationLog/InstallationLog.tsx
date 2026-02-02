import { FC, useEffect, useState } from 'react';
import LogViewer from '@/src/components/Common/LogViewer/LogViewer';

interface Props {
  imageBuildId?: string;
}

const InstallationLog: FC<Props> = ({ imageBuildId }) => {
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    const eventSource = new EventSource(`/api/sse?entity=image&id=${imageBuildId}`);

    eventSource.addEventListener('logs', (event) => {
      setLogs((prev) => prev + event.data + '\n');
    });

    eventSource.addEventListener('status', () => {
      eventSource.close();
    });

    return () => {
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
