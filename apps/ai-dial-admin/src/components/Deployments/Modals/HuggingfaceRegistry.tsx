import { FC, useState } from 'react';
import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import HfRegistryGrid from '@/src/components/Deployments/HFRegistryGrid/HFRegistryGrid';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (modelName: string) => void;
  preselectedModelName?: string;
  route: ApplicationRoute;
}

const HFRegistryModal: FC<Props> = ({ isModalOpen, onClose, onApply, preselectedModelName, route }) => {
  const t = useI18n();
  const [selectedModelName, setSelectedModelName] = useState<string>(preselectedModelName ?? '');

  return (
    <DialFormPopup
      portalId="HFRegistryModal"
      open={isModalOpen}
      header={t(ContainersI18nKey.SelectModelFromRegistry)}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      onClose={onClose}
      onSubmit={() => {
        onApply(selectedModelName);
        onClose();
      }}
      className={'h-[800px]'}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col h-full">
        <HfRegistryGrid route={route} modelName={selectedModelName} setModelName={setSelectedModelName} />
      </div>
    </DialFormPopup>
  );
};

export default HFRegistryModal;
