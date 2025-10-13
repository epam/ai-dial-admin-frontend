import { FC, ReactNode, useCallback, useMemo } from 'react';
import { IconBrandOauth, IconKey, IconLockOff } from '@tabler/icons-react';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import AuthTypeSection from './Auth/AuthTypeSection';
import Field from '../../Common/Field/Field';

interface Props {
  toolset: Toolset;
  onChange: (entity: Toolset) => void;
}

export interface AuthConfig {
  id: ToolsetAuthType;
  title: string;
  icon?: ReactNode;
}
const Authentication: FC<Props> = ({ toolset, onChange }) => {
  const t = useI18n();
  const selectedAuthType = useMemo(() => toolset.authSettings?.authenticationType || ToolsetAuthType.NONE, [toolset]);

  const authOptions: AuthConfig[] = [
    // {
    //   id: ToolsetAuthType.OAUTH,
    //   name: 'OAuth 2.0',
    //   content: <OAuthControls toolset={toolset} onChange={onChange} />,
    // },

    { id: ToolsetAuthType.OAUTH, title: t(ToolsetI18nKey.OAuth), icon: <IconBrandOauth {...BASE_ICON_PROPS} /> },
    { id: ToolsetAuthType.API_KEY, title: t(ToolsetI18nKey.ApiKey), icon: <IconKey {...BASE_ICON_PROPS} /> },
    { id: ToolsetAuthType.NONE, title: t(ToolsetI18nKey.NoneAuth), icon: <IconLockOff {...BASE_ICON_PROPS} /> },
  ];

  const onChangeAuthType = useCallback(
    (authenticationType: ToolsetAuthType) => {
      onChange({
        ...toolset,
        authSettings: { ...toolset.authSettings, authenticationType },
      });
    },
    [onChange, toolset],
  );

  return (
    <div className="flex flex-col gap-y-3">
      <Field fieldTitle={t(EntityFieldsI18nKey.authSettings)} />
      {authOptions.map((option) => (
        <AuthTypeSection
          key={option.id}
          config={option}
          isSelected={option.id === selectedAuthType}
          onClick={onChangeAuthType}
          authSettings={toolset.authSettings}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

export default Authentication;
