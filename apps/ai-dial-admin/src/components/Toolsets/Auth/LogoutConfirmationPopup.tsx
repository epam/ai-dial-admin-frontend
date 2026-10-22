'use client';

import { Checkbox, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC, useState } from 'react';

import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';

interface Props {
  isModalOpen: boolean;
  isLoggedInAsUser: boolean;
  isLoggedInAsOrganization: boolean;
  onClose: () => void;
  onConfirm: (levels: ToolsetAuthCredentialLevel[]) => void;
}

const LogoutConfirmationPopup: FC<Props> = ({
  isModalOpen,
  isLoggedInAsUser,
  isLoggedInAsOrganization,
  onClose,
  onConfirm,
}) => {
  const t = useI18n();
  const [logoutUser, setLogoutUser] = useState(isLoggedInAsUser);
  const [logoutOrganization, setLogoutOrganization] = useState(isLoggedInAsOrganization);

  const handleConfirm = () => {
    const levelsToLogout: ToolsetAuthCredentialLevel[] = [];
    if (logoutUser) levelsToLogout.push(ToolsetAuthCredentialLevel.USER);
    if (logoutOrganization) levelsToLogout.push(ToolsetAuthCredentialLevel.GLOBAL);
    onConfirm(levelsToLogout);
  };

  return (
    <Popup
      onClose={onClose}
      header={t(ToolsetI18nKey.LogOut)}
      portalId="LogoutConfirmationPopup"
      open={isModalOpen}
      size={PopupSize.Sm}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ToolsetI18nKey.LogOut),
        isSubmitDisabled: !logoutUser && !logoutOrganization,
        onCancel: onClose,
        onSubmit: handleConfirm,
      })}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-4">
        <p className="text-sm">{t(ToolsetI18nKey.SelectLogoutLevels)}</p>
        {isLoggedInAsUser && (
          <Checkbox
            id="personal-logout-checkbox"
            labelProps={{ label: t(ToolsetI18nKey.Personal) }}
            isSelected={logoutUser}
            onChange={(v) => setLogoutUser(!!v)}
          />
        )}
        {isLoggedInAsOrganization && (
          <Checkbox
            id="organization-logout-checkbox"
            labelProps={{ label: t(ToolsetI18nKey.Organization) }}
            isSelected={logoutOrganization}
            onChange={(v) => setLogoutOrganization(!!v)}
          />
        )}
      </div>
    </Popup>
  );
};

export default LogoutConfirmationPopup;
