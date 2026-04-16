'use client';

import { DialLabelledText, DialLoader } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';
import { FC, useMemo } from 'react';

import CodeViewer from '@/src/components/Common/CodeViewer/CodeViewer';
import SidePanel from '@/src/components/Common/SidePanel/SidePanel';
import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { ContainersI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { isValidHttpUrl } from '@/src/utils/validation/url-error';

interface Props {
  server?: McpServer & { updatedAt?: string };
  serverResponse?: McpServerResponse | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const McpServerDetails: FC<Props> = ({ server, serverResponse, isLoading, isOpen, onClose }) => {
  const t = useI18n();

  const jsonContent = useMemo(() => {
    if (!server) return '';
    if (serverResponse) return JSON.stringify(serverResponse, null, 2);
    return JSON.stringify({ server }, null, 2);
  }, [server, serverResponse]);

  const remoteTypes = useMemo(() => server?.remotes?.map((r) => r.type) ?? [], [server?.remotes]);

  return (
    <SidePanel label={t(ContainersI18nKey.ServerDetails)} isOpen={isOpen} onClose={onClose}>
      {server && (
        <div className="flex flex-col gap-4 overflow-y-auto">
          <h3 className="dial-h3">{server.name}</h3>

          {server.description && <p className="dial-small-text text-primary">{server.description}</p>}

          <div className="flex flex-row gap-6">
            <DialLabelledText label={t(EntityFieldsI18nKey.version)} text={server.version} />
            {server.updatedAt && (
              <DialLabelledText
                label={t(ContainersI18nKey.LastUpdate)}
                text={formatDateTimeToLocalString(server.updatedAt)}
              />
            )}
          </div>

          {server.repository?.url && (
            <DialLabelledText label={t(ContainersI18nKey.Repository)}>
              {isValidHttpUrl(server.repository.url) ? (
                <a
                  href={server.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary hover:underline inline-flex items-center gap-1"
                >
                  {server.repository.url}
                  <IconExternalLink size={14} />
                </a>
              ) : (
                <span>{server.repository.url}</span>
              )}
            </DialLabelledText>
          )}

          {remoteTypes.length > 0 && (
            <DialLabelledText label={t(ContainersI18nKey.Remotes)}>
              <div className="flex">
                <TagsCellRenderer items={remoteTypes} />
              </div>
            </DialLabelledText>
          )}

          {isLoading ? (
            <DialLoader size={32} />
          ) : (
            <CodeViewer title={t(ContainersI18nKey.ViewFullServerJson)} content={jsonContent} hideFullscreen />
          )}
        </div>
      )}
    </SidePanel>
  );
};

export default McpServerDetails;
