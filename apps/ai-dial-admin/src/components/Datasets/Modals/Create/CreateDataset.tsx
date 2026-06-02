import { FC, useCallback, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { ButtonsI18nKey, DatasetsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onCreate: (dataset: Dataset) => void;
}

const CreateDataset: FC<Props> = ({ onClose, isModalOpen, onCreate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [dataset, setDataset] = useState<Dataset>({ visibility: DatasetVisibility.PUBLIC });

  const onSubmit = useCallback(() => {
    onCreate(dataset);
  }, [onCreate, dataset]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(DatasetsI18nKey.CreateDataset)}
      portalId="CreateDatasetModal"
      open={isModalOpen}
      size={PopupSize.Md}
      onSubmit={onSubmit}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
      onCancel={onClose}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <DisplayNameControl
          displayName={dataset.name}
          required
          isFullWidth={false}
          onChange={(name) => setDataset((prev) => ({ ...prev, name }))}
        />
        <DescriptionControl isFullWidth={false} entity={dataset} onChangeEntity={setDataset} />
      </div>
    </DialFormPopup>
  );
};

export default CreateDataset;
