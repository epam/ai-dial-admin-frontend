import { FC, useCallback, useEffect, useState } from 'react';
import {
  DialCloseButton,
  DialFormPopup,
  DialLoader,
  DialNoDataContent,
  DialTooltip,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getModelDetails } from '@/src/app/actions/deployments';
import { useI18n } from '@/src/locales/client';
import HfRegistryGrid from '@/src/components/Deployments/HFRegistryGrid/HFRegistryGrid';
import MdViewer from '@/src/components/Common/MdViewer/MdViewer';

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
  const [isDescriptionShown, setIsDescriptionShown] = useState<boolean>(false);
  const [descriptionModelData, setDescriptionModelData] = useState<{ modelName?: string; sha?: string }>({});
  const [descriptionData, setDescriptionData] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isDescriptionShown && descriptionModelData.modelName && descriptionModelData.sha) {
      setIsLoading(true);
      setIsDescriptionShown(true);
      getModelDetails(descriptionModelData.modelName, descriptionModelData.sha).then(({ response, success }) => {
        if (success) {
          setDescriptionData(response as string);
        } else {
          setDescriptionData('');
        }
        setIsLoading(false);
      });
    }
  }, [descriptionModelData.modelName, descriptionModelData.sha, isDescriptionShown]);

  const showModelDescription = useCallback((modelName: string, sha: string) => {
    setDescriptionModelData({ modelName, sha });
  }, []);

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
      className={'h-[800px]'}
      size={PopupSize.Lg}
    >
      <div className="flex h-full bg-layer-2 py-4 px-6 gap-4">
        <HfRegistryGrid
          route={route}
          modelName={selectedModelName}
          setModelName={setSelectedModelName}
          showModelDescription={showModelDescription}
        />
        {isDescriptionShown && descriptionModelData.modelName && (
          <div className="flex flex-col  lg:w-[420px] p-4 border border-primary rounded h-full">
            <div className="flex flex-row justify-between items-center">
              <h3 className="flex-1 min-w-0 mr-3 truncate">
                <DialTooltip tooltip={descriptionModelData.modelName}>{descriptionModelData.modelName}</DialTooltip>
              </h3>
              <DialCloseButton onClose={() => setIsDescriptionShown(false)} />
            </div>
            {isLoading ? (
              <DialLoader size={40} />
            ) : (
              <>
                {descriptionData.length ? (
                  <MdViewer content={descriptionData} />
                ) : (
                  <DialNoDataContent title={t(ContainersI18nKey.NoDescriptionAvailable)} />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default HFRegistryModal;
