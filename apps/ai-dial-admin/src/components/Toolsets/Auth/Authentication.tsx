import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode, useCallback, useMemo } from 'react';

import Field from '@/src/components/Common/Field/Field';
import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import AuthTypeSection from './Sections/AuthTypeSection';

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
  const selectedAuthType = useMemo(() => toolset.authSettings?.authenticationType || ToolsetAuthType.NONE, [toolset]);

  const authOptions: AuthConfig[] = [
    { id: ToolsetAuthType.OAUTH, title: t(ToolsetI18nKey.OAuth), icon: <IconBrandOauth {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.API_KEY, title: t(ToolsetI18nKey.ApiKey), icon: <IconKey {...BASE_BUTTON_ICON_PROPS} /> },
    { id: ToolsetAuthType.NONE, title: t(ToolsetI18nKey.NoneAuth), icon: <IconLockOff {...BASE_BUTTON_ICON_PROPS} /> },
  ];

  const onChangeAuthType = useCallback(
    (authenticationType: ToolsetAuthType) => {
      onChange?.({
        ...toolset,
        forwardPerRequestKey: authenticationType === ToolsetAuthType.API_KEY ? false : toolset.forwardPerRequestKey,
        authSettings: {
          authenticationType,
        },
      });
    },
    [onChange, toolset],
  );

  return (
    <div className={classNames('flex flex-col gap-y-2', STANDARD_CONTROL_WIDTH)}>
      <Field fieldTitle={t(EntityFieldsI18nKey.authSettings)} />
      <div className="flex flex-col gap-y-3">
        {disabled ? (
          <AuthTypeSection
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
