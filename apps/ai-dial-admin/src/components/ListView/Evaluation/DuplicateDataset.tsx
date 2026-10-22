import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useEffect, useState } from 'react';

import { getDatasetByName } from '@/src/app/[lang]/datasets/actions';
import DatasetProperties from '@/src/components/Datasets/Properties/Properties';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  entity: Dataset;
  isModalOpen: boolean;
  onClose: () => void;
  onDuplicate: (entity: Pick<Dataset, 'name' | 'description'>) => void;
}

const DuplicateDataset: FC<Props> = ({ entity, isModalOpen, onClose, onDuplicate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [dataset, setDataset] = useState<Dataset>({
    name: getClonedEntityName(entity.name),
    description: entity.description,
  });
  const [nameExistsError, setNameExistsError] = useState<string>();
  const [isCheckingName, setIsCheckingName] = useState(false);

  useEffect(() => {
    setNameExistsError(undefined);
  }, [dataset.name]);

  const onCheckAndDuplicate = useCallback(async () => {
    if (!dataset.name) return;
    setIsCheckingName(true);
    const res = await getDatasetByName(dataset.name);
    setIsCheckingName(false);
    if (res && res.content?.length > 0) {
      setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
    } else {
      onDuplicate({ name: dataset.name, description: dataset.description });
    }
  }, [dataset, onDuplicate, t]);

  return (
    <Popup
      onClose={onClose}
      header={getCloneTitle(ApplicationRoute.Datasets, t)}
      portalId="DuplicateDataset"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Duplicate),
        isSubmitDisabled: !isValid || isCheckingName || nameExistsError !== undefined,
        onCancel: onClose,
        onSubmit: onCheckAndDuplicate,
      })}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <DatasetProperties dataset={dataset} onChange={setDataset} nameExistsError={nameExistsError} isModal />
      </div>
    </Popup>
  );
};

export default DuplicateDataset;
