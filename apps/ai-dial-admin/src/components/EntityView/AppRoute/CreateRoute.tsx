import { FC, useState } from 'react';
import { ButtonVariant, DialButton, DialTextInputField } from '@epam/ai-dial-ui-kit';

import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';

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
        <DialTextInputField
          elementId="name"
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={name}
          onChange={(name) => setName(name || '')}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <DialButton
          variant={ButtonVariant.Primary}
          title={t(ButtonsI18nKey.Create)}
          disable={!name}
          onClick={() => {
            onCreate(name);
            setName('');
          }}
        />
      </div>
    </Popup>
  );
};

export default CreateRoute;
