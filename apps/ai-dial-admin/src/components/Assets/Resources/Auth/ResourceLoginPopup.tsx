'use client';

import { DialCheckbox, DialFormPopup, DialPasswordInput, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useMemo, useState } from 'react';

import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  ToolsetI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/resource';

interface Props {
  isModalOpen: boolean;
  type?: ToolsetAuthType;
  isLoggedInAsUser?: boolean;
  isLoggedInAsOrganization?: boolean;
  orgLabel?: string;
  userLabel?: string;
  onClose: () => void;
  onLogin: (levels: ToolsetAuthCredentialLevel[], apiKeyValue: string) => void;
}

const ResourceLoginPopup: FC<Props> = ({
  type,
  isModalOpen,
  isLoggedInAsUser,
  isLoggedInAsOrganization,
  orgLabel,
  userLabel,
  onClose,
  onLogin,
}) => {
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
      disableSubmitButton={disableSubmitButton}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-4">
        {showOrganizationCheckbox && (
          <DialCheckbox
            id="organization-login-checkbox"
            label={orgLabel ?? t(ToolsetI18nKey.Organization)}
            checked={loginOrganization}
            onChange={handleOrganizationChange}
            disabled={!showUserCheckbox}
          />
        )}
        {showUserCheckbox && (
          <DialCheckbox
            id="personal-login-checkbox"
            label={userLabel ?? t(ToolsetI18nKey.Personal)}
            checked={loginUser}
            onChange={handleUserChange}
            disabled={!showOrganizationCheckbox}
          />
        )}

        {type === ToolsetAuthType.API_KEY && (
          <DialPasswordInput
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
    </DialFormPopup>
  );
};

export default ResourceLoginPopup;
