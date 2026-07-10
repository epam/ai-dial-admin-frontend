'use client';

import { DialFormPopup, DialCheckbox, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/resource';

interface Props {
  isModalOpen: boolean;
  isLoggedInAsUser: boolean;
  isLoggedInAsOrganization: boolean;
  onClose: () => void;
  onConfirm: (levels: ToolsetAuthCredentialLevel[]) => void;
}

const ResourceLogoutPopup: FC<Props> = ({
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
    <DialFormPopup
      onClose={onClose}
      header={t(ToolsetI18nKey.LogOut)}
      portalId="ResourceLogoutPopup"
      open={isModalOpen}
      onSubmit={handleConfirm}
      submitLabel={t(ToolsetI18nKey.LogOut)}
      onCancel={onClose}
      size={PopupSize.Sm}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!logoutUser && !logoutOrganization}
    >
      <div className="flex px-6 py-4 h-full flex-col gap-y-4">
        <p className="text-sm">{t(ToolsetI18nKey.SelectLogoutLevels)}</p>
        {isLoggedInAsUser && (
          <DialCheckbox
            id="personal-logout-checkbox"
            label={t(ToolsetI18nKey.Personal)}
            checked={logoutUser}
            onChange={(v) => setLogoutUser(!!v)}
          />
        )}
        {isLoggedInAsOrganization && (
          <DialCheckbox
            id="organization-logout-checkbox"
            label={t(ToolsetI18nKey.Organization)}
            checked={logoutOrganization}
            onChange={(v) => setLogoutOrganization(!!v)}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default ResourceLogoutPopup;
