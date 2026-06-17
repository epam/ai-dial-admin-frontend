import { DialLabel } from '@epam/ai-dial-ui-kit';
import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useMemo } from 'react';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import AuthTypeSection from './Sections/AuthTypeSection';
import { TOOLSET_AUTH_REDIRECT_URL } from './AuthButtons';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

interface Props {
  toolset: Toolset;
  disabled?: boolean;
  view: ApplicationRoute;
  onChange?: (entity: Toolset) => void;
}

export interface AuthConfig {
  id: ToolsetAuthType;
  title: string;
  icon?: ReactNode;
}
const Authentication: FC<Props> = ({ disabled, view, toolset, onChange, ...props }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = disabled || isReadOnlyAdmin;
  const selectedAuthType = useMemo(() => toolset.authSettings?.authenticationType || ToolsetAuthType.NONE, [toolset]);

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
        forwardPerRequestKey: authenticationType === ToolsetAuthType.API_KEY ? false : toolset.forwardPerRequestKey,
        authSettings: {
          authenticationType,
          redirectUri:
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
          <AuthTypeSection
            toolsetName={toolset.name || ''}
            config={authOptions.find((option) => option.id === selectedAuthType)!}
            isSelected={true}
            disabled={true}
            view={view}
            authSettings={toolset.authSettings}
            {...props}
          />
        ) : (
          authOptions.map((option) => (
            <AuthTypeSection
              key={option.id}
              toolsetName={toolset.name || ''}
              view={view}
              config={option}
              isSelected={option.id === selectedAuthType}
              onClick={onChangeAuthType}
              authSettings={toolset.authSettings}
              onChange={(authSettings) => onChange?.({ ...toolset, authSettings })}
              {...props}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Authentication;
