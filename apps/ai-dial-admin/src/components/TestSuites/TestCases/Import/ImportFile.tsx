'use client';

import { DialFormPopup, DialLoadFileAreaField, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedTestSuiteId: string;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

const ImportFileModal: FC<Props> = ({ isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const onChangeFile = (files: File[]) => {
    const body = new FormData();

    body.append('file', files[0] as File);

    // importTestCase(selectedTestSuiteId, body).then((res) => {
    //   console.log('importTestCase res', res);
    // });
    // Handle file change
  };

  return (
    <DialFormPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(TestSuitesI18nKey.ImportFromPC)}
      portalId="ImportFileModal"
      size={PopupSize.Lg}
      onSubmit={onApply}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 flex-col h-[800px]">
        <DialLoadFileAreaField
          elementId="ddd"
          fieldTitle="fff"
          acceptTypes="/"
          emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
          emptyTextSecondLine={t(BasicI18nKey.Or)}
          emptyButtonLabel={t(ButtonsI18nKey.Browse)}
          onChange={onChangeFile}
          multiple={false}
        />
      </div>
    </DialFormPopup>
  );
};

export default ImportFileModal;
