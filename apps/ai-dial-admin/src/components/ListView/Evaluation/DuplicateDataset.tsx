import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import { getDatasetByName } from '@/src/app/[lang]/datasets/actions';
import DatasetProperties from '@/src/components/Datasets/Properties/Properties';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  entity: Dataset;
  isModalOpen: boolean;
  onClose: () => void;
  onDuplicate: (entity: Dataset) => void;
}

const DuplicateDataset: FC<Props> = ({ entity, isModalOpen, onClose, onDuplicate }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();
  const [dataset, setDataset] = useState<Dataset>({
    name: getClonedEntityName(entity.name),
    description: entity.description,
    visibility: DatasetVisibility.PUBLIC,
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
      onDuplicate({ ...dataset, testCaseSchema: entity.testCaseSchema });
    }
  }, [dataset, entity.testCaseSchema, onDuplicate, t]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCloneTitle(ApplicationRoute.Datasets, t)}
      portalId="DuplicateDataset"
      open={isModalOpen}
      onSubmit={onCheckAndDuplicate}
      onCancel={onClose}
      disableSubmitButton={!isValid || isCheckingName || nameExistsError !== undefined}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6">
        <DatasetProperties dataset={dataset} onChange={setDataset} nameExistsError={nameExistsError} isModal />
      </div>
    </DialFormPopup>
  );
};

export default DuplicateDataset;
