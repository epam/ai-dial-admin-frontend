'use client';

import { DialFormPopup, DialLoadFileAreaField, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DialLoadFileArea } from '@epam/ai-dial-ui-kit/dist/src/components/LoadFileArea/LoadFileArea';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

const ImportFileModal: FC<Props> = ({ isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const onChangeFile = (files: File[]) => {
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
          acceptTypes=".csv"
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
