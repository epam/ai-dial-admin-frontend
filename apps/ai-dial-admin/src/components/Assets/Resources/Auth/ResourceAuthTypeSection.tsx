import { FC, useCallback, useMemo, useState } from 'react';

import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { getAuthTypeStorageKey } from '@/src/components/Toolsets/Auth/utils';
import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResourceAuthSettings, ToolsetAuthType } from '@/src/models/dial/resource';
import { getFromSessionStorage, setToSessionStorage } from '@/src/utils/session-storage';
import ResourceApiKeySection from './ResourceApiKeySection';
import { AuthConfig } from './ResourceAuthentication';
import ResourceOAuthSection from './ResourceOAuthSection';

enum AuthType {
  With_login = 'With_login',
  With_config_and_login = 'With_config_and_login',
}

interface Props {
  toolsetName: string;
  config: AuthConfig;
  isSelected: boolean;
  disabled?: boolean;
  onClick?: (type: ToolsetAuthType) => void;
  authSettings?: DialToolsetResourceAuthSettings;
  onChange?: (authSettings: DialToolsetResourceAuthSettings) => void;
}

const ResourceAuthTypeSection: FC<Props> = ({
  toolsetName,
  disabled,
  config,
  isSelected,
  onClick,
  authSettings,
  onChange,
  ...props
}) => {
  const t = useI18n();

  const [selectedAuthType, setSelectedAuthType] = useState(
    () => (getFromSessionStorage(getAuthTypeStorageKey(toolsetName)) as AuthType) || AuthType.With_login,
  );

  const radioLogin: RadioButtonWithContent[] = useMemo(() => {
    const buttons = [
      {
        id: AuthType.With_login,
        name: t(ToolsetI18nKey.WithLogin),
      },
    ];

    if (config.id === ToolsetAuthType.OAUTH) {
      buttons.push({
        id: AuthType.With_config_and_login,
        name: t(ToolsetI18nKey.WithLoginAndConfig),
      });
    }

    return buttons;
  }, [config.id, t]);

  const handleOnClick = useCallback(() => {
    onClick?.(config.id);
  }, [config.id, onClick]);

  const onChangeAuth = useCallback(
    (value: string) => {
      setSelectedAuthType(value as AuthType);
      setToSessionStorage(getAuthTypeStorageKey(toolsetName), value);
    },
    [toolsetName],
  );

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

        <span className="dial-small font-semibold">{config.title}</span>
      </div>
      {isSelected && config.id !== ToolsetAuthType.NONE && (
        <div className="flex flex-col gap-4 border-t border-tertiary p-4">
          {config.id === ToolsetAuthType.OAUTH && (
            <DialRadioGroup
              elementId="auth"
              disabled={disabled}
              activeRadioButton={selectedAuthType}
              orientation={RadioGroupOrientation.Row}
              radioButtons={radioLogin}
              onChange={onChangeAuth}
            />
          )}
          {config.id === ToolsetAuthType.API_KEY && (
            <ResourceApiKeySection disabled={disabled} authSettings={authSettings} onChange={onChange} {...props} />
          )}

          {selectedAuthType === AuthType.With_config_and_login && config.id === ToolsetAuthType.OAUTH && (
            <ResourceOAuthSection disabled={disabled} authSettings={authSettings} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceAuthTypeSection;
