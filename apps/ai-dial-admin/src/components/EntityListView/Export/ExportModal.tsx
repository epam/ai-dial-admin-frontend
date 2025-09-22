'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import { ButtonsI18nKey, ExportI18nKey, FoldersI18nKey, PromptsI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ImportFileType as FileType, ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';

interface Props {
  modalState: PopUpState;
  route?: ApplicationRoute;
  onClose: () => void;
  onApply?: (fileType: FileType) => void;
}

const ExportModal: FC<Props> = ({ modalState, route, onClose, onApply }) => {
  const containerClassName = classNames('lg:max-w-[450px]');
  const t = useI18n() as (stringToTranslate: string) => string;

  const exportTypeRadio: RadioButtonModel[] = [
    { id: ImportFileType.ARCHIVE, name: t(TypeI18nKey.Archive) },
    { id: ImportFileType.JSON, name: t(TypeI18nKey.JSON) },
  ];

  const [exportType, setExportType] = useState(exportTypeRadio[0].id);

  return (
    <Popup
      onClose={onClose}
      heading={route === ApplicationRoute.Prompts ? t(PromptsI18nKey.Export) : t(FoldersI18nKey.Export)}
      portalId="ExportModal"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex px-6 py-6 flex-1 flex-col min-h-0">
        <RadioField
          radioButtons={exportTypeRadio}
          activeRadioButton={exportType}
          elementId="type"
          fieldTitle={t(ExportI18nKey.ExportFormat)}
          orientation={RadioFieldOrientation.Column}
          onChange={setExportType}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Export)}
          onClick={() => onApply?.(exportType as ImportFileType)}
        />
      </div>
    </Popup>
  );
};

export default ExportModal;
