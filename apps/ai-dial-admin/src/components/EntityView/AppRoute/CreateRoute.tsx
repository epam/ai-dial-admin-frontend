import { DialFormPopup, DialTextInputField, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { getCreateEntityTitle } from '@/src/utils/entities/create-entity';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  isModalOpen: boolean;
  onCreate: (name: string) => void;
  onClose: () => void;
}

const CreateRoute: FC<Props> = ({ isModalOpen, onClose, onCreate }) => {
  const t = useI18n() as (str: string) => string;

  const [name, setName] = useState('');

  return (
    <DialFormPopup
      onClose={onClose}
      title={getCreateEntityTitle(ApplicationRoute.Routes, t)}
      submitLabel={t(ButtonsI18nKey.Create)}
      size={PopupSize.Sm}
      onSubmit={() => {
        onCreate(name);
        setName('');
      }}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
      disableSubmitButton={!name}
      portalId="CreateRoute"
      open={isModalOpen}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <DialTextInputField
          elementId="name"
          fieldTitle={t(EntityFieldsI18nKey.displayName)}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={name}
          onChange={(name) => setName(name || '')}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateRoute;
