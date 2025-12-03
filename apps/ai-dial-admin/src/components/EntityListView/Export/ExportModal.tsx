'use client';

import { FC, useState } from 'react';

import {
  ButtonVariant,
  DialButton,
  DialPopup,
  DialRadioGroup,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ExportI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ImportFileType as FileType, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getModalTitle } from './utils';

interface Props {
  isModalOpen: boolean;
  route?: ApplicationRoute;
  onClose: () => void;
  onApply?: (fileType: FileType) => void;
}

const ExportModal: FC<Props> = ({ isModalOpen, route, onClose, onApply }) => {
  const t = useI18n();

  const exportTypeRadio: RadioButtonWithContent[] = [
    { id: ImportFileType.ARCHIVE, name: t(TypeI18nKey.Archive) },
    { id: ImportFileType.JSON, name: t(TypeI18nKey.JSON) },
  ];

  const [exportType, setExportType] = useState(exportTypeRadio[0].id);

  return (
    <DialPopup
      onClose={onClose}
      title={getModalTitle(route, t)}
      portalId="ExportModal"
      open={isModalOpen}
      size={PopupSize.Sm}
    >
      <div className="flex px-6 py-6 h-full flex-col">
        <DialRadioGroup
          radioButtons={exportTypeRadio}
          activeRadioButton={exportType}
          elementId="type"
          fieldTitle={t(ExportI18nKey.ExportFormat)}
          orientation={RadioGroupOrientation.Column}
          onChange={setExportType}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          label={t(ButtonsI18nKey.Export)}
          onClick={() => onApply?.(exportType as ImportFileType)}
        />
      </div>
    </DialPopup>
  );
};

export default ExportModal;
