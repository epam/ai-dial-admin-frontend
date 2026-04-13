import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import McpRegistryGrid from '@/src/components/Deployments/McpRegistryGrid/McpRegistryGrid';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { McpRegistryFetchFn, McpServer } from '@/src/types/deployments/mcp-registry';
import { ApplicationRoute } from '@/src/types/routes';

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

  const handleSelect = useCallback((server: McpServer) => {
    setSelectedServer(server);
  }, []);

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
        />
      </div>
    </DialFormPopup>
  );
};

export default McpRegistryModal;
