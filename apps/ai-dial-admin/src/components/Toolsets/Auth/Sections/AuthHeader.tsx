import { FC } from 'react';
import classNames from 'classnames';

import { EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { isAdminLoggedInToToolset, isUserLoggedInToToolset } from '@/src/utils/toolset/toolset-auth';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { useI18n } from '@/src/locales/client';

interface Props {
  toolset: Toolset;
}

export const AuthHeader: FC<Props> = ({ toolset }) => {
  if (!toolset.authSettings?.authenticationType || toolset.authSettings.authenticationType === ToolsetAuthType.NONE) {
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
