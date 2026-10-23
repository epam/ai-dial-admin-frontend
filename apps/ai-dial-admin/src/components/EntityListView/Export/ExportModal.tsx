'use client';

import { FC, useState } from 'react';

import {
  OutlinedButton,
  Popup,
  PrimaryButton,
  RadioGroup,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { toRadioItems } from '@/src/utils/radio-items';

import { ButtonsI18nKey, ExportI18nKey, ImportI18nKey, TypeI18nKey } from '@/src/constants/i18n';
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
    { id: ImportFileType.ARCHIVE, name: t(ImportI18nKey.DialArchive) },
    { id: ImportFileType.JSON, name: t(TypeI18nKey.JSON) },
  ];

  const [exportType, setExportType] = useState(exportTypeRadio[0].id);

  return (
    <Popup
      onClose={onClose}
      header={getModalTitle(route, t)}
      portalId="ExportModal"
      open={isModalOpen}
      size={PopupSize.Sm}
    >
      <div className="flex p-6 h-full flex-col">
        <RadioGroup
          items={toRadioItems(exportTypeRadio)}
          value={exportType}
          id="type"
          labelProps={{ label: t(ExportI18nKey.ExportFormat) }}
          orientation={RadioGroupOrientation.Column}
          onChange={setExportType}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <OutlinedButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <PrimaryButton label={t(ButtonsI18nKey.Export)} onClick={() => onApply?.(exportType as ImportFileType)} />
      </div>
    </Popup>
  );
};

export default ExportModal;
