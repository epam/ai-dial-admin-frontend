'use client';

import {
  DialFormPopup,
  DialPasswordInput,
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
  isLoggedInAsUser?: boolean;
  isLoggedInAsOrganization?: boolean;
  onClose: () => void;
  onLogin: (type: ToolsetAuthCredentialLevel, apiKeyValue: string) => void;
}

const LoginPopup: FC<Props> = ({ type, isModalOpen, isLoggedInAsUser, isLoggedInAsOrganization, onClose, onLogin }) => {
  const t = useI18n();

  const radioButtons: RadioButtonWithContent[] = [
    { id: ToolsetAuthCredentialLevel.GLOBAL, name: t(ToolsetI18nKey.Organization) },
    { id: ToolsetAuthCredentialLevel.USER, name: t(ToolsetI18nKey.Personal) },
  ];

  // If logged in at one level, default to the other; otherwise default to GLOBAL
  const defaultAuthType = isLoggedInAsOrganization
    ? ToolsetAuthCredentialLevel.USER
    : ToolsetAuthCredentialLevel.GLOBAL;

  const [authType, setAuthType] = useState(defaultAuthType);
  const [apiKeyValue, setApiKeyValue] = useState('');

  // Show level selector only when neither level is logged in yet
  const showLevelSelector = !isLoggedInAsUser && !isLoggedInAsOrganization;

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
        {showLevelSelector && (
          <DialRadioGroup
            fieldTitle={t(EntityFieldsI18nKey.authenticationType)}
            orientation={RadioGroupOrientation.Column}
            radioButtons={radioButtons}
            activeRadioButton={authType}
            elementId="auth-type"
            onChange={(id) => setAuthType(id as ToolsetAuthCredentialLevel)}
          />
        )}

        {type === ToolsetAuthType.API_KEY && (
          <DialPasswordInput
            id="apiKeyValue"
            labelProps={{ label: t(EntityFieldsI18nKey.apiKeyValue) }}
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
