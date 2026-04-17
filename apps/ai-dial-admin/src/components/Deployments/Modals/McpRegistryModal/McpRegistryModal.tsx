import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import { getMcpServerVersion } from '@/src/app/actions/deployments';
import McpRegistryGrid from '@/src/components/Deployments/McpRegistryGrid/McpRegistryGrid';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { McpRegistryFetchFn, McpServer, McpServerResponse } from '@/src/types/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';

import McpServerDetails from './McpServerDetails';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (server: McpServer) => void;
  fetchServers: McpRegistryFetchFn;
  preselectedServer?: Pick<McpServer, 'name' | 'version'>;
  view: ApplicationRoute;
}

const McpRegistryModal: FC<Props> = ({ isModalOpen, onClose, onApply, fetchServers, preselectedServer, view }) => {
  const t = useI18n();
  const [selectedServer, setSelectedServer] = useState<McpServer | undefined>(undefined);
  const [detailsServer, setDetailsServer] = useState<McpServer | undefined>(undefined);
  const [detailsResponse, setDetailsResponse] = useState<McpServerResponse | null | undefined>(undefined);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const handleSelect = useCallback((server: McpServer) => {
    setSelectedServer(server);
  }, []);

  const handleShowDetails = useCallback((server: McpServer) => {
    setDetailsServer(server);
    setDetailsResponse(undefined);
    setIsDetailsOpen(true);
    setIsDetailsLoading(true);
    const requestKey = `${server.name}@${server.version}`;
    getMcpServerVersion(server.name, server.version).then((result) => {
      // Drop the result if the user has moved on to a different server in the meantime
      setDetailsServer((current) => {
        if (!current || `${current.name}@${current.version}` !== requestKey) {
          return current;
        }
        if (result.success) {
          setDetailsResponse(result.response ?? null);
        } else {
          setDetailsResponse(null);
        }
        setIsDetailsLoading(false);
        return current;
      });
    });
  }, []);

  const handleCloseDetails = useCallback(() => {
    setIsDetailsOpen(false);
  }, []);

  const infoPanel = useMemo(
    () => (
      <McpServerDetails
        server={detailsServer}
        serverResponse={detailsResponse ?? undefined}
        isLoading={isDetailsLoading}
        isOpen={isDetailsOpen}
        onClose={handleCloseDetails}
      />
    ),
    [detailsServer, detailsResponse, isDetailsLoading, isDetailsOpen, handleCloseDetails],
  );

  return (
    <DialFormPopup
      portalId="McpRegistryModal"
      open={isModalOpen}
      header={t(ContainersI18nKey.SelectMcpServerFromRegistry)}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      onClose={onClose}
      onSubmit={() => {
        if (selectedServer) {
          onApply(selectedServer);
          onClose();
        }
      }}
      disableSubmitButton={!selectedServer}
      className="h-[800px]"
      size={PopupSize.Lg}
    >
      <div className="flex h-full bg-layer-2 py-4 px-6 gap-4">
        <McpRegistryGrid
          selectedServer={selectedServer ?? preselectedServer}
          onSelect={handleSelect}
          fetchServers={fetchServers}
          view={view}
          infoPanel={infoPanel}
          onShowDetails={handleShowDetails}
        />
      </div>
    </DialFormPopup>
  );
};

export default McpRegistryModal;
