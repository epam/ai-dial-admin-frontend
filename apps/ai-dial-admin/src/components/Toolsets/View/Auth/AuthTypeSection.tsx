import { DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC, useCallback, useMemo } from 'react';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings, ToolsetAuthType } from '@/src/models/dial/toolset';
import { AuthConfig } from '../Authentication';
import ApiKeySection from './ApiKeySection';
import OAuthSection from './OAuthSection';

interface Props {
  config: AuthConfig;
  isSelected: boolean;
  onClick: (type: ToolsetAuthType) => void;
  authSettings?: ToolsetAuthSettings;
  onChange: (authSettings: ToolsetAuthSettings) => void;
}

const AuthTypeSection: FC<Props> = ({ config, isSelected, onClick, authSettings, onChange }) => {
  const t = useI18n();

  // const toolsetDetails = useAppSelector(ToolsetSelectors.selectToolsetDetails);

  // const isSignedIn = toolsetDetails && isToolsetSignedIn(toolsetDetails);

  const isWithLogin = true;
  const radioLogin: RadioButtonWithContent[] = useMemo(() => {
    const buttons = [
      {
        id: 'with-config',
        name: t(ToolsetI18nKey.WithLogin),
      },
    ];

    if (config.id === ToolsetAuthType.API_KEY) {
      buttons.push({
        id: 'without-config',
        name: t(ToolsetI18nKey.WithoutLogin),
      });
    } else if (config.id === ToolsetAuthType.OAUTH) {
      buttons.push({
        id: 'with-config-and-login',
        name: t(ToolsetI18nKey.WithLoginAndConfig),
      });
    }

    return buttons;
  }, [config.id, t]);

  const handleOnClick = useCallback(() => {
    // if (!isSignedIn) onClick(type);
    onClick(config.id);
  }, [config.id, onClick]);

  const onChangeAuth = useCallback(() => {
    console.log('Change auth type');
  }, [config.id, onClick]);

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
            activeRadioButton={radioLogin[0].id}
            orientation={RadioGroupOrientation.Row}
            radioButtons={radioLogin}
            onChange={onChangeAuth}
          />

          {isWithLogin && (
            <>
              {config.id === ToolsetAuthType.API_KEY && (
                <ApiKeySection authSettings={authSettings} onChange={onChange} />
              )}

              {config.id === ToolsetAuthType.OAUTH && <OAuthSection authSettings={authSettings} onChange={onChange} />}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTypeSection;
