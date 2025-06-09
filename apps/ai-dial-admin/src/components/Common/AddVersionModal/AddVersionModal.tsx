import { FC, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  modalState: PopUpState;
  existingVersions: string[];
  onClose: () => void;
  onConfirm: (version: string) => void;
}

const AddVersionModal: FC<Props> = ({ modalState, existingVersions, onConfirm, onClose }) => {
  const t = useI18n();
  const [version, setVersion] = useState<string>('');

  return (
    <Popup onClose={onClose} heading={'Create new version'} portalId="ConfirmationModal" state={modalState}>
      <div className="text-primary small px-6 py-4">
        <TextInputField
          elementId="name"
          fieldTitle={t(CreateI18nKey.VersionTitle)}
          placeholder={t(CreateI18nKey.VersionPlaceholder)}
          value={version}
          onChange={setVersion}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Create)}
          onClick={() => onConfirm(version)}
          disable={existingVersions.includes(version)}
        />
      </div>
    </Popup>
  );
};

export default AddVersionModal;
