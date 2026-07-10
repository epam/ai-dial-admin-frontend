import { FC, ReactNode, useCallback, useMemo } from 'react';

import { DialLabel } from '@epam/ai-dial-ui-kit';
import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';
import classNames from 'classnames';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';
import { TOOLSET_AUTH_REDIRECT_URL } from './ResourceAuthButtons';
import ResourceAuthTypeSection from './ResourceAuthTypeSection';

interface Props {
  toolset: DialToolsetResource;
  disabled?: boolean;
  onChange?: (entity: DialToolsetResource) => void;
}

export interface AuthConfig {
  id: ToolsetAuthType;
  title: string;
  icon?: ReactNode;
}
const ResourceAuthentication: FC<Props> = ({ disabled, toolset, onChange, ...props }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;
  const selectedAuthType = useMemo(() => toolset.auth_settings?.authentication_type || ToolsetAuthType.NONE, [toolset]);

  const authOptions: AuthConfig[] = [
    { id: ToolsetAuthType.OAUTH, title: t(ToolsetI18nKey.OAuth), icon: <IconBrandOauth {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.API_KEY, title: t(ToolsetI18nKey.ApiKey), icon: <IconKey {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.NONE, title: t(ToolsetI18nKey.NoneAuth), icon: <IconLockOff {...BASE_BUTTON_ICON_PROPS} /> },
  ];

  const onChangeAuthType = useCallback(
    (authenticationType: ToolsetAuthType) => {
      dispatch({ type: ValidationActionType.Reset });
      onChange?.({
        ...toolset,
        forward_per_request_key:
          authenticationType === ToolsetAuthType.API_KEY ? false : toolset.forward_per_request_key,
        auth_settings: {
          authentication_type: authenticationType,
          redirect_uri:
            authenticationType === ToolsetAuthType.OAUTH
              ? `${window.location.origin}${TOOLSET_AUTH_REDIRECT_URL}`
              : undefined,
        },
      });
    },
    [dispatch, onChange, toolset],
  );

  return (
    <div className={classNames('flex flex-col gap-y-1', STANDARD_CONTROL_WIDTH)}>
      <DialLabel label={t(EntityFieldsI18nKey.authSettings)} />
      <div className="flex flex-col gap-y-3">
        {isDisabled ? (
          <ResourceAuthTypeSection
            toolsetName={toolset.name || ''}
            config={authOptions.find((option) => option.id === selectedAuthType)!}
            isSelected={true}
            disabled={true}
            authSettings={toolset.auth_settings}
            {...props}
          />
        ) : (
          authOptions.map((option) => (
            <ResourceAuthTypeSection
              key={option.id}
              toolsetName={toolset.name || ''}
              config={option}
              isSelected={option.id === selectedAuthType}
              onClick={onChangeAuthType}
              authSettings={toolset.auth_settings}
              onChange={(auth_settings) => onChange?.({ ...toolset, auth_settings })}
              {...props}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ResourceAuthentication;
