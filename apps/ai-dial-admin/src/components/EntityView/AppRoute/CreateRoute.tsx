import { Popup, DialInput, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useCallback, useState } from 'react';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldError } from '@/src/models/error';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateEntityTitle } from '@/src/utils/entities/create-entity';
import { getErrorForAppRouteName } from '@/src/utils/validation/name-error';

interface Props {
  isModalOpen: boolean;
  routeNames?: string[];
  onCreate: (name: string) => void;
  onClose: () => void;
}

const CreateRoute: FC<Props> = ({ isModalOpen, routeNames, onClose, onCreate }) => {
  const t = useI18n();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<FieldError | null>(null);

  const validateName = useCallback(
    (name?: string) => {
      const error = getErrorForAppRouteName(name, routeNames, t);
      setNameError(error);
    },
    [routeNames, t],
  );

  const onChangeName = useCallback(
    (name?: string) => {
      const trimmedValue = name?.trimStart() || '';
      setName(trimmedValue);
      validateName(trimmedValue);
    },
    [validateName],
  );

  return (
    <Popup
      onClose={onClose}
      header={getCreateEntityTitle(ApplicationRoute.Routes, t)}
      size={PopupSize.Sm}
      portalId="CreateRoute"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !name || !!nameError,
        onCancel: onClose,
        onSubmit: () => {
          onCreate(name);
          setName('');
        },
      })}
    >
      <div className="flex flex-col overflow-auto px-6 py-4">
        <DialInput
          id="name"
          labelProps={{ label: t(EntityFieldsI18nKey.displayName) }}
          placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
          value={name}
          onChange={onChangeName}
          invalid={!!nameError}
          error={nameError?.text}
        />
      </div>
    </Popup>
  );
};

export default CreateRoute;
