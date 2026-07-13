import { FC } from 'react';
import classNames from 'classnames';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { useI18n } from '@/src/locales/client';
import { DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';
import { isAdminLoggedInToToolset, isUserLoggedInToToolset } from '../utils';

interface Props {
  toolset: DialToolsetResource;
}

const ResourceAuthHeader: FC<Props> = ({ toolset }) => {
  if (
    !toolset.auth_settings?.authentication_type ||
    toolset.auth_settings.authentication_type === ToolsetAuthType.NONE
  ) {
    return null;
  }
  const t = useI18n();

  const isUserLoggedIn = isUserLoggedInToToolset(toolset);
  const isAdminLoggedIn = isAdminLoggedInToToolset(toolset);
  const isAuthenticated = isUserLoggedIn && isAdminLoggedIn;

  const getAuthStatusLabel = () => {
    if (isAuthenticated) {
      return t(ToolsetI18nKey.isAuthenticated);
    }

    if (isUserLoggedIn) {
      return t(ToolsetI18nKey.UserLoggedIn);
    }

    if (isAdminLoggedIn) {
      return t(ToolsetI18nKey.AdminLoggedIn);
    }

    return t(ToolsetI18nKey.LoggedOut);
  };

  return (
    <LabelledText label={t(EntityFieldsI18nKey.authentication)}>
      <div className="flex items-center gap-2">
        <div
          className={classNames(
            'w-[10px] h-[10px] rounded-full',
            isUserLoggedIn || isAdminLoggedIn ? 'bg-accent-secondary' : 'bg-red-400',
          )}
        ></div>
        <div>{getAuthStatusLabel()}</div>
      </div>
    </LabelledText>
  );
};

export default ResourceAuthHeader;
