import { FC, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  modalState: PopUpState;
  onCreate: (name: string) => void;
  onClose: () => void;
}

const CreateRoute: FC<Props> = ({ modalState, onClose, onCreate }) => {
  const t = useI18n();

  const [name, setName] = useState('');

  return (
    <Popup onClose={onClose} heading={t(CreateI18nKey.Route)} portalId="CreateRoute" state={modalState}>
      <div className="flex flex-col overflow-auto px-6 py-4">
        <TextInputField
          elementId="name"
          fieldTitle={t(CreateI18nKey.DisplayNameTitle)}
          placeholder={t(CreateI18nKey.DescriptionPlaceholder)}
          value={name}
          onChange={(name) => setName(name)}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Create)} onClick={() => onCreate(name)} />
      </div>
    </Popup>
  );
};

export default CreateRoute;
