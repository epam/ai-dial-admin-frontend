import { FC, useCallback, useEffect, useState } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import { getDatasetByName } from '@/src/app/[lang]/datasets/actions';
import DatasetProperties from '@/src/components/Datasets/Properties/Properties';
import { ButtonsI18nKey, DatasetsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
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
  const [nameExistsError, setNameExistsError] = useState<string>();

  const onSubmit = useCallback(() => {
    getDatasetByName(dataset.name!).then((res) => {
      if (res && res.content?.length > 0) {
        setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
      } else {
        onCreate(dataset);
      }
    });
  }, [dataset, t, onCreate]);

  useEffect(() => {
    setNameExistsError(undefined);
  }, [dataset.name, t]);

  return (
    <Popup
      onClose={onClose}
      header={t(DatasetsI18nKey.CreateDataset)}
      portalId="CreateDatasetModal"
      open={isModalOpen}
      size={PopupSize.Md}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !isValid || nameExistsError !== undefined || !dataset.name,
        onCancel: onClose,
        onSubmit: onSubmit,
      })}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <DatasetProperties dataset={dataset} onChange={setDataset} nameExistsError={nameExistsError} isModal />
      </div>
    </Popup>
  );
};

export default CreateDataset;
