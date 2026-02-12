import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import HfRegistryGrid from '@/src/components/Deployments/HFRegistryGrid/HFRegistryGrid';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import ModelDescription from './ModelDescription';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (modelName: string) => void;
  preselectedModelName?: string;
  route: ApplicationRoute;
}

const HFRegistryModal: FC<Props> = ({ isModalOpen, onClose, onApply, preselectedModelName, route }) => {
  const t = useI18n();
  const [selectedModelName, setSelectedModelName] = useState(preselectedModelName ?? '');
  const [isDescriptionShown, setIsDescriptionShown] = useState(false);
  const [descriptionModelData, setDescriptionModelData] = useState<{ modelName?: string; sha?: string }>({});

  const showModelDescription = useCallback((modelName: string, sha: string) => {
    setDescriptionModelData({ modelName, sha });
    setIsDescriptionShown(true);
  }, []);

  const infoPanel = useMemo(() => {
    return (
      <ModelDescription
        descriptionModelData={descriptionModelData}
        isDescriptionShown={isDescriptionShown}
        onChangeIsDescriptionShown={setIsDescriptionShown}
      />
    );
  }, [descriptionModelData, isDescriptionShown]);

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
      disableSubmitButton={!selectedModelName}
      className="h-[800px]"
      size={PopupSize.Lg}
    >
      <div className="flex h-full bg-layer-2 py-4 px-6 gap-4">
        <HfRegistryGrid
          route={route}
          modelName={selectedModelName}
          setModelName={setSelectedModelName}
          showModelDescription={showModelDescription}
          infoPanel={infoPanel}
        />
      </div>
    </DialFormPopup>
  );
};

export default HFRegistryModal;
