'use client';

import {
  DialFormPopup,
  DialRadioGroup,
  PopupSize,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ButtonsI18nKey, EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthCredentialLevel } from '@/src/models/dial/toolset';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onLogin: (type: ToolsetAuthCredentialLevel) => void;
}

const LoginPopup: FC<Props> = ({ isModalOpen, onClose, onLogin }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  const radioButtons: RadioButtonWithContent[] = [
    { id: ToolsetAuthCredentialLevel.GLOBAL, name: t(ToolsetI18nKey.AsAdmin) },
    { id: ToolsetAuthCredentialLevel.USER, name: t(ToolsetI18nKey.AsUser) },
  ];

  const [authType, setAuthType] = useState(radioButtons[0].id);

  return (
    <DialFormPopup
      onClose={onClose}
      title={t(ToolsetI18nKey.LogIn)}
      portalId="LogInPopup"
      open={isModalOpen}
      onSubmit={() => onLogin(authType as ToolsetAuthCredentialLevel)}
      submitLabel={t(ToolsetI18nKey.LogIn)}
      onCancel={onClose}
      size={PopupSize.Sm}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 h-full flex-col">
        <DialRadioGroup
          fieldTitle={t(EntityFieldsI18nKey.authenticationType)}
          orientation={RadioGroupOrientation.Column}
          radioButtons={radioButtons}
          activeRadioButton={authType}
          elementId="auth-type"
          onChange={setAuthType}
        />
      </div>
    </DialFormPopup>
  );
};

export default LoginPopup;
