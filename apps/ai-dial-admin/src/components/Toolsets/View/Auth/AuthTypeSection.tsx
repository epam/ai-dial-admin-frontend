import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings, ToolsetAuthType } from '@/src/models/dial/toolset';
import { AuthConfig } from '../Authentication';
import ApiKeySection from './ApiKeySection';
import OAuthSection from './OAuthSection';

enum AuthType {
  With_login = 'With_login',
  Without_login = 'Without_login',
  With_config_and_login = 'With_config_and_login',
}

interface Props {
  config: AuthConfig;
  isSelected: boolean;
  onClick: (type: ToolsetAuthType) => void;
  apiKeyValue?: string;
  authSettings?: ToolsetAuthSettings;
  onChange: (authSettings: ToolsetAuthSettings) => void;
  onChangeKeyValue?: (apiKeyValue: string) => void;
}

const AuthTypeSection: FC<Props> = ({ config, isSelected, onClick, authSettings, onChange, ...props }) => {
  const t = useI18n();

  const [selectedAuthType, setSelectedAuthType] = useState(AuthType.With_login);

  const radioLogin: RadioButtonWithContent[] = useMemo(() => {
    const buttons = [
      {
        id: AuthType.With_login,
        name: t(ToolsetI18nKey.WithLogin),
      },
    ];

    if (config.id === ToolsetAuthType.API_KEY) {
      buttons.push({
        id: AuthType.Without_login,
        name: t(ToolsetI18nKey.WithoutLogin),
      });
    } else if (config.id === ToolsetAuthType.OAUTH) {
      buttons.push({
        id: AuthType.With_config_and_login,
        name: t(ToolsetI18nKey.WithLoginAndConfig),
      });
    }

    return buttons;
  }, [config.id, t]);

  useEffect(() => {
    const value = authSettings?.clientId
      ? AuthType.With_config_and_login
      : config.id === ToolsetAuthType.API_KEY
        ? AuthType.Without_login
        : AuthType.With_login;
    setSelectedAuthType(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnClick = useCallback(() => {
    onClick(config.id);
  }, [config.id, onClick]);

  const onChangeAuth = useCallback((value: string) => {
    setSelectedAuthType(value as AuthType);
  }, []);

  return (
    <div className="flex flex-col w-full rounded bg-layer-3 border border-tertiary">
      <div
        className={classNames(
          'flex cursor-pointer border-l-2 p-4 gap-x-3',
          isSelected ? 'border-accent-primary text-accent-primary' : 'border-transparent text-primary',
        )}
        onClick={handleOnClick}
      >
        {config.icon}

        <span className={classNames('dial-small font-semibold')}>{config.title}</span>
      </div>
      {isSelected && config.id !== ToolsetAuthType.NONE && (
        <div className="flex flex-col gap-4 border-t border-tertiary p-4">
          <DialRadioGroup
            elementId="auth"
            activeRadioButton={selectedAuthType}
            orientation={RadioGroupOrientation.Row}
            radioButtons={radioLogin}
            onChange={onChangeAuth}
          />
          {selectedAuthType === AuthType.With_login && config.id === ToolsetAuthType.API_KEY && (
            <ApiKeySection authSettings={authSettings} onChange={onChange} {...props} />
          )}

          {selectedAuthType === AuthType.With_config_and_login && config.id === ToolsetAuthType.OAUTH && (
            <OAuthSection authSettings={authSettings} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTypeSection;
