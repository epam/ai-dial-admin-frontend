'use client';

import {
  DialFormPopup,
  DialPasswordInputField,
  DialRadioGroup,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/toolset';

interface Props {
  isModalOpen: boolean;
  type?: ToolsetAuthType;
  onClose: () => void;
  onLogin: (type: ToolsetAuthCredentialLevel, apiKeyValue: string) => void;
}

const LoginPopup: FC<Props> = ({ type, isModalOpen, onClose, onLogin }) => {
  const t = useI18n();

  const radioButtons: RadioButtonWithContent[] = [
    { id: ToolsetAuthCredentialLevel.GLOBAL, name: t(ToolsetI18nKey.Organization) },
    { id: ToolsetAuthCredentialLevel.USER, name: t(ToolsetI18nKey.Personal) },
  ];

  const [authType, setAuthType] = useState(radioButtons[0].id);
  const [apiKeyValue, setApiKeyValue] = useState('');

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(ToolsetI18nKey.LogIn)}
      portalId="LogInPopup"
      open={isModalOpen}
      onSubmit={() => onLogin(authType as ToolsetAuthCredentialLevel, apiKeyValue)}
      submitLabel={t(ToolsetI18nKey.LogIn)}
      onCancel={onClose}
      size={PopupSize.Sm}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-8">
        <DialRadioGroup
          fieldTitle={t(EntityFieldsI18nKey.authenticationType)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={radioButtons}
          activeRadioButton={authType}
          elementId="auth-type"
          onChange={setAuthType}
        />

        {type === ToolsetAuthType.API_KEY && (
          <DialPasswordInputField
            elementId="apiKeyValue"
            fieldTitle={t(EntityFieldsI18nKey.apiKeyValue)}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            value={apiKeyValue}
            onChange={(v) => setApiKeyValue(v || '')}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default LoginPopup;
