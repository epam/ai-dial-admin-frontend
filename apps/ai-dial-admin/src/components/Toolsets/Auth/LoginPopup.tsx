'use client';

import { Checkbox, PasswordInput, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { FC, useMemo, useState } from 'react';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
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
  const [loginUser, setLoginUser] = useState(!isLoggedInAsUser);
  const [apiKeyValue, setApiKeyValue] = useState('');

  const showOrganizationCheckbox = !isLoggedInAsOrganization;
  const showUserCheckbox = !isLoggedInAsUser;

  const handleOrganizationChange = (value?: boolean) => {
    const nextValue = !!value;
    setLoginOrganization(nextValue);
  };

  const handleUserChange = (value?: boolean) => {
    const nextValue = !!value;
    setLoginUser(nextValue);
  };

  const handleSubmit = () => {
    const levelsToLogin: ToolsetAuthCredentialLevel[] = [];
    if (loginOrganization) levelsToLogin.push(ToolsetAuthCredentialLevel.GLOBAL);
    if (loginUser) levelsToLogin.push(ToolsetAuthCredentialLevel.USER);
    onLogin(levelsToLogin, apiKeyValue);
  };

  const disableSubmitButton = useMemo(() => {
    const isNoLoginSelected = !loginOrganization && !loginUser;
    if (type === ToolsetAuthType.API_KEY) {
      return isNoLoginSelected || !apiKeyValue;
    }
    return isNoLoginSelected;
  }, [type, loginOrganization, loginUser, apiKeyValue]);

  return (
    <Popup
      onClose={onClose}
      header={t(ToolsetI18nKey.LogIn)}
      portalId="LogInPopup"
      open={isModalOpen}
      size={PopupSize.Sm}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ToolsetI18nKey.LogIn),
        isSubmitDisabled: disableSubmitButton,
        onCancel: onClose,
        onSubmit: handleSubmit,
      })}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-4">
        {showOrganizationCheckbox && (
          <Checkbox
            id="organization-login-checkbox"
            labelProps={{ label: t(ToolsetI18nKey.Organization) }}
            isSelected={loginOrganization}
            onChange={handleOrganizationChange}
            disabled={!showUserCheckbox}
          />
        )}
        {showUserCheckbox && (
          <Checkbox
            id="personal-login-checkbox"
            labelProps={{ label: t(ToolsetI18nKey.Personal) }}
            isSelected={loginUser}
            onChange={handleUserChange}
            disabled={!showOrganizationCheckbox}
          />
        )}

        {type === ToolsetAuthType.API_KEY && (
          <PasswordInput
            id="apiKeyValue"
            labelProps={{ label: t(EntityFieldsI18nKey.apiKeyValue), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.Value)}
            value={apiKeyValue}
            onChange={(v) => setApiKeyValue(v || '')}
            invalid={!apiKeyValue}
            error={!apiKeyValue ? t(ErrorI18nKey.RequiredField) : undefined}
          />
        )}
      </div>
    </Popup>
  );
};

export default LoginPopup;
