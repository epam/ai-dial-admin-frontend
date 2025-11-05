import { FC, ReactNode, useCallback, useMemo } from 'react';
import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import AuthTypeSection from './Auth/AuthTypeSection';
import Field from '@/src/components/Common/Field/Field';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  toolset: Toolset;
  disabled?: boolean;
  onChange?: (entity: Toolset) => void;
  apiKeyValue?: string;
  onChangeKeyValue?: (apiKeyValue: string) => void;
}

export interface AuthConfig {
  id: ToolsetAuthType;
  title: string;
  icon?: ReactNode;
}
const Authentication: FC<Props> = ({ disabled, toolset, onChange, ...props }) => {
  const t = useI18n();
  const selectedAuthType = useMemo(() => toolset.authSettings?.authenticationType || ToolsetAuthType.NONE, [toolset]);

  const authOptions: AuthConfig[] = [
    { id: ToolsetAuthType.OAUTH, title: t(ToolsetI18nKey.OAuth), icon: <IconBrandOauth {...BASE_ICON_PROPS} /> },
    { id: ToolsetAuthType.API_KEY, title: t(ToolsetI18nKey.ApiKey), icon: <IconKey {...BASE_ICON_PROPS} /> },
    { id: ToolsetAuthType.NONE, title: t(ToolsetI18nKey.NoneAuth), icon: <IconLockOff {...BASE_ICON_PROPS} /> },
  ];

  const onChangeAuthType = useCallback(
    (authenticationType: ToolsetAuthType) => {
      onChange?.({
        ...toolset,
        authSettings: {
          authenticationType,
          redirectUri:
            authenticationType === ToolsetAuthType.OAUTH
              ? `${window.location.origin}${getUrnForEntity(ApplicationRoute.AssetsToolsets, toolset)}`
              : void 0,
        },
      });
    },
    [onChange, toolset],
  );

  return (
    <div className="flex flex-col gap-y-3 w-full lg:w-[45%]">
      <Field fieldTitle={t(EntityFieldsI18nKey.authSettings)} />
      {disabled ? (
        <AuthTypeSection
          config={authOptions.find((option) => option.id === selectedAuthType)!}
          isSelected={true}
          disabled={true}
          authSettings={toolset.authSettings}
          {...props}
        />
      ) : (
        authOptions.map((option) => (
          <AuthTypeSection
            key={option.id}
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
  );
};

export default Authentication;
