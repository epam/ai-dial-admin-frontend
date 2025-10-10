import { FC, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TextInputField } from '@/src/components/Common/InputField/InputField';

interface Props {
  isModalOpen: boolean;
  onCreate: (name: string) => void;
  onClose: () => void;
}

const CreateRoute: FC<Props> = ({ isModalOpen, onClose, onCreate }) => {
  const t = useI18n();

  const [name, setName] = useState('');

  return (
    <DialPopup
      onClose={onClose}
      title={t(CreateI18nKey.Route)}
      portalId="CreateRoute"
      open={isModalOpen}
      size={PopupSize.Md}
      dividers={true}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <TextInputField
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
    </DialPopup>
  );
};

export default CreateRoute;
