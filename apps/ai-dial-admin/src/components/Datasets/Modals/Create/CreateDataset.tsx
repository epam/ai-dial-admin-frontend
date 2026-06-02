import { FC, useCallback, useState } from 'react';

import { DialNeutralButton, DialPopup, DialPrimaryButton, PopupSize } from '@epam/ai-dial-ui-kit';

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
    <DialPopup
      onClose={onClose}
      header={t(DatasetsI18nKey.CreateDataset)}
      portalId="CreateDatasetModal"
      open={isModalOpen}
      size={PopupSize.Sm}
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

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4 border-t border-primary flex-shrink-0">
        <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialPrimaryButton label={t(ButtonsI18nKey.Create)} onClick={onSubmit} disabled={!isValid} />
      </div>
    </DialPopup>
  );
};

export default CreateDataset;
