import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DeploymentsI18nKey, ErrorI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Image } from '@/src/models/deployments/images';
import { mergeAllowedDomains } from '@/src/utils/deployments/whitelist';
import { getErrorNotification } from '@/src/utils/notification';

import BlockedDomainBanner from '@/src/components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner';
import LogViewer from '@/src/components/Common/LogViewer/LogViewer';

interface Props {
  selectedImage: Image;
  onChange: (image: Image) => void;
  setHasBlockedDomains: (value: boolean) => void;
}

const InstallationLog: FC<Props> = ({ selectedImage, onChange, setHasBlockedDomains }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [logs, setLogs] = useState<string>('');
  const [blockedDomains, setBlockedDomains] = useState<string[]>([]);

  const allowedDomainsRef = useRef<string[] | undefined>(selectedImage.allowedDomains);
  allowedDomainsRef.current = selectedImage.allowedDomains;

  useEffect(() => {
    if (!selectedImage.id) return;

    const eventSource = new EventSource(`/api/sse?entity=image&id=${selectedImage.id}`);

    const handleLogs = (event: MessageEvent) => {
      if (event.data != null) {
        setLogs((prev) => prev + event.data + '\n');
      }
    };

    const handleDomain = (event: MessageEvent) => {
      try {
        const { domain, verdict } = JSON.parse(event.data);
        if (verdict !== 'BLOCKED' || !domain) return;
        if (allowedDomainsRef.current?.includes(domain)) return;
        setBlockedDomains((prev) => (prev.includes(domain) ? prev : [...prev, domain]));
        setHasBlockedDomains(true);
      } catch (e) {
        console.error('[SSE] Error parsing event: domain', e);
      }
    };

    const handleError = (event: Event) => {
      const messageEvent = event as MessageEvent;
      try {
        const { message } = JSON.parse(messageEvent.data);
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), message));
      } catch {
        showNotification(getErrorNotification(t(ErrorI18nKey.Error), t(DeploymentsI18nKey.LogsError)));
      }
      eventSource.close();
    };

    eventSource.addEventListener('logs', handleLogs);
    eventSource.addEventListener('domain', handleDomain);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('logs', handleLogs);
      eventSource.removeEventListener('domain', handleDomain);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [selectedImage.id, setHasBlockedDomains, showNotification, t]);

  const onAddToAllowed = useCallback(() => {
    onChange({
      ...selectedImage,
      allowedDomains: mergeAllowedDomains(selectedImage.allowedDomains, blockedDomains),
    });
    setBlockedDomains([]);
    setHasBlockedDomains(false);
  }, [blockedDomains, onChange, selectedImage, setHasBlockedDomains]);

  return (
    <div className="flex flex-col h-full gap-4">
      {blockedDomains.length > 0 && (
        <BlockedDomainBanner
          message={t(ImagesI18nKey.BlockedDomainInBuild, { domain: blockedDomains[0] })}
          buttonLabel={t(DeploymentsI18nKey.AddToAllowedDomains)}
          onAddToAllowed={onAddToAllowed}
        />
      )}
      <div className="flex-1 min-h-0">
        <LogViewer logs={logs} />
      </div>
    </div>
  );
};

export default InstallationLog;
