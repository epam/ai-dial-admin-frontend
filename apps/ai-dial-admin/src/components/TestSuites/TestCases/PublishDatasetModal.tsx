'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getDatasetByName } from '@/src/app/[lang]/datasets/actions';
import DatasetProperties from '@/src/components/Datasets/Properties/Properties';
import { ButtonsI18nKey, ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';

interface Props {
  isOpen: boolean;
  testCaseCount: number;
  onClose: () => void;
  onConfirm: (displayName: string, description?: string) => void;
}

const PublishDatasetModal: FC<Props> = ({ isOpen, testCaseCount, onClose, onConfirm }) => {
  const t = useI18n();
  const [dataset, setDataset] = useState<Dataset>({});
  const [nameExistsError, setNameExistsError] = useState<string>();

  const onCreateClick = useCallback(() => {
    getDatasetByName(dataset.name!).then((res) => {
      if (res && res.content?.length > 0) {
        setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
      } else {
        onConfirm(dataset.name!, dataset.description || undefined);
      }
    });
  }, [dataset, t, onConfirm]);

  useEffect(() => {
    setNameExistsError(undefined);
  }, [dataset.name]);

  const onCloseModal = useCallback(() => {
    setDataset({});
    setNameExistsError(undefined);
    onClose();
  }, [onClose]);

  return (
    <DialFormPopup
      onClose={onCloseModal}
      header={t(TestSuitesI18nKey.PublishToDataset)}
      portalId="PublishDatasetModal"
      open={isOpen}
      onSubmit={onCreateClick}
      onCancel={onCloseModal}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!dataset.name?.trim() || nameExistsError !== undefined}
      size={PopupSize.Md}
    >
      <div className="flex flex-col gap-4 py-4 px-6">
        <p className="dial-small text-secondary">
          {t(TestSuitesI18nKey.PublishToDatasetCountText, { count: testCaseCount })}
        </p>
        <DatasetProperties dataset={dataset} onChange={setDataset} nameExistsError={nameExistsError} isModal />
      </div>
    </DialFormPopup>
  );
};

export default PublishDatasetModal;
