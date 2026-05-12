'use client';

import { DialCheckbox, DialFormPopup, DialPasswordInput, PopupSize } from '@epam/ai-dial-ui-kit';
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
  onLogin: (levels: ToolsetAuthCredentialLevel[], apiKeyValue: string) => void;
}

const LoginPopup: FC<Props> = ({ type, isModalOpen, isLoggedInAsUser, isLoggedInAsOrganization, onClose, onLogin }) => {
  const t = useI18n();
  const [loginOrganization, setLoginOrganization] = useState(!isLoggedInAsOrganization);
  const [loginUser, setLoginUser] = useState(!!isLoggedInAsOrganization && !isLoggedInAsUser);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const showOrganizationCheckbox = !isLoggedInAsOrganization;
  const showUserCheckbox = !isLoggedInAsUser;

  const handleOrganizationChange = (value?: boolean) => {
    const nextValue = !!value;
    setLoginOrganization(nextValue);
    if (type === ToolsetAuthType.OAUTH && nextValue) {
      setLoginUser(false);
    }
  };

  const handleUserChange = (value?: boolean) => {
    const nextValue = !!value;
    setLoginUser(nextValue);
    if (type === ToolsetAuthType.OAUTH && nextValue) {
      setLoginOrganization(false);
    }
  };

  const handleSubmit = () => {
    const levelsToLogin: ToolsetAuthCredentialLevel[] = [];
    if (loginOrganization) levelsToLogin.push(ToolsetAuthCredentialLevel.GLOBAL);
    if (loginUser) levelsToLogin.push(ToolsetAuthCredentialLevel.USER);
    onLogin(levelsToLogin, apiKeyValue);
  };

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(ToolsetI18nKey.LogIn)}
      portalId="LogInPopup"
      open={isModalOpen}
      onSubmit={handleSubmit}
      submitLabel={t(ToolsetI18nKey.LogIn)}
      onCancel={onClose}
      size={PopupSize.Sm}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!loginOrganization && !loginUser}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-3">
        {showOrganizationCheckbox && (
          <DialCheckbox
            id="organization-login-checkbox"
            label={t(ToolsetI18nKey.Organization)}
            checked={loginOrganization}
            onChange={handleOrganizationChange}
          />
        )}
        {showUserCheckbox && (
          <DialCheckbox
            id="personal-login-checkbox"
            label={t(ToolsetI18nKey.Personal)}
            checked={loginUser}
            onChange={handleUserChange}
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
