import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import McpRegistryGrid from '@/src/components/Deployments/McpRegistryGrid/McpRegistryGrid';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { McpServer } from '@/src/types/deployments/mcp-registry';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (server: McpServer) => void;
  preselectedServer?: McpServer;
}

const McpRegistryModal: FC<Props> = ({ isModalOpen, onClose, onApply, preselectedServer }) => {
  const t = useI18n();
  const [selectedServer, setSelectedServer] = useState<McpServer | undefined>(preselectedServer);

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
        <McpRegistryGrid selectedServer={selectedServer} onSelect={handleSelect} />
      </div>
    </DialFormPopup>
  );
};

export default McpRegistryModal;
