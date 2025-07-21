import { FC, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  heading: string;
  modalState: PopUpState;
  existingVersions: string[];
  prefilledVersion?: string;
  onClose: () => void;
  onConfirm: (version: string) => void;
}

const AddVersionModal: FC<Props> = ({
  heading,
  modalState,
  existingVersions,
  prefilledVersion,
  onConfirm,
  onClose,
}) => {
  const t = useI18n();
  const [version, setVersion] = useState<string>(prefilledVersion || '');

  return (
    <Popup onClose={onClose} heading={heading} portalId="newVersionModal" state={modalState}>
      <div className=" flex flex-col gap-4 text-primary small px-6 py-4">
        {prefilledVersion && <div className="text-secondary">Create a new version to save changes. </div>}
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
