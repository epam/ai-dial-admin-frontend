import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import { getModelDetails } from '@/src/app/actions/deployments';
import MdViewer from '@/src/components/Common/MdViewer/MdViewer';
import SidePanel from '@/src/components/Common/SidePanel/SidePanel';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  descriptionModelData: { modelName?: string; sha?: string };
  isDescriptionShown: boolean;
  onChangeIsDescriptionShown: (isShown: boolean) => void;
}

const ModelDescription: FC<Props> = ({ descriptionModelData, isDescriptionShown, onChangeIsDescriptionShown }) => {
  const t = useI18n();

  const [descriptionData, setDescriptionData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isDescriptionShown && descriptionModelData.modelName && descriptionModelData.sha) {
      setIsLoading(true);
      getModelDetails(descriptionModelData.modelName, descriptionModelData.sha).then(({ response, success }) => {
        if (success) {
          setDescriptionData(response as string);
        } else {
          setDescriptionData('');
        }
        setIsLoading(false);
      });
    }
  }, [descriptionModelData, isDescriptionShown]);

  const hasModelContext = Boolean(descriptionModelData.modelName && descriptionModelData.sha);

  return (
    <SidePanel
      label={t(ContainersI18nKey.ModelDetails)}
      isOpen={isDescriptionShown && hasModelContext}
      onClose={() => onChangeIsDescriptionShown(false)}
    >
      {isLoading ? (
        <DialLoader size={40} />
      ) : descriptionData.length ? (
        <MdViewer content={descriptionData} />
      ) : (
        <DialNoDataContent title={t(ContainersI18nKey.NoDescriptionAvailable)} />
      )}
    </SidePanel>
  );
};

export default ModelDescription;
