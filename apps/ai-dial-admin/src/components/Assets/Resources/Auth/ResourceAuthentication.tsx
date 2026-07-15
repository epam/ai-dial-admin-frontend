import { FC, ReactNode, useCallback, useMemo } from 'react';

import { DialLabel } from '@epam/ai-dial-ui-kit';
import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';
import classNames from 'classnames';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResourceAuthSettings, ToolsetAuthType } from '@/src/models/dial/resource';
import ResourceAuthTypeSection from './ResourceAuthTypeSection';

interface Props {
  name: string;
  authSettings?: DialToolsetResourceAuthSettings;
  redirectUrl?: string;
  disabled?: boolean;
  hideWithLoginOption?: boolean;
  onChange?: (authSettings: DialToolsetResourceAuthSettings, forwardPerRequestKey?: boolean) => void;
}

export interface AuthConfig {
  id: ToolsetAuthType;
  title: string;
  icon?: ReactNode;
}

const ResourceAuthentication: FC<Props> = ({
  disabled,
  name,
  authSettings,
  redirectUrl,
  hideWithLoginOption,
  onChange,
  ...props
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;
  const selectedAuthType = useMemo(() => authSettings?.authentication_type || ToolsetAuthType.NONE, [authSettings]);

  const authOptions: AuthConfig[] = [
    { id: ToolsetAuthType.OAUTH, title: t(ToolsetI18nKey.OAuth), icon: <IconBrandOauth {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.API_KEY, title: t(ToolsetI18nKey.ApiKey), icon: <IconKey {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.NONE, title: t(ToolsetI18nKey.NoneAuth), icon: <IconLockOff {...BASE_BUTTON_ICON_PROPS} /> },
  ];

  const onChangeAuthType = useCallback(
    (authenticationType: ToolsetAuthType) => {
      dispatch({ type: ValidationActionType.Reset });

      onChange?.(
        {
          authentication_type: authenticationType,
          redirect_uri:
            authenticationType === ToolsetAuthType.OAUTH && redirectUrl
              ? `${window.location.origin}${redirectUrl}`
              : undefined,
        },
        authenticationType === ToolsetAuthType.API_KEY ? false : undefined,
      );
    },
    [dispatch, onChange, redirectUrl],
  );

  return (
    <div className={classNames('flex flex-col gap-y-1', STANDARD_CONTROL_WIDTH)}>
      <DialLabel label={t(EntityFieldsI18nKey.authSettings)} />
      <div className="flex flex-col gap-y-3">
        {isDisabled ? (
          <ResourceAuthTypeSection
            toolsetName={name}
            config={authOptions.find((option) => option.id === selectedAuthType)!}
            isSelected={true}
            disabled={true}
            authSettings={authSettings}
            withLoginVisible={!hideWithLoginOption}
            {...props}
          />
        ) : (
          authOptions.map((option) => (
            <ResourceAuthTypeSection
              key={option.id}
              toolsetName={name}
              config={option}
              isSelected={option.id === selectedAuthType}
              onClick={onChangeAuthType}
              authSettings={authSettings}
              onChange={onChange}
              withLoginVisible={!hideWithLoginOption}
              {...props}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceAuthentication;
