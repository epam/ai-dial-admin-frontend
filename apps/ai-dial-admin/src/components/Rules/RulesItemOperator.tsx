'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  folderName?: string;
  isEmpty: boolean;
  isReadonly: boolean;
}

const RulesItemOperator: FC<Props> = ({ folderName, isEmpty, isReadonly }) => {
  const t = useI18n();
  const message = !folderName
    ? t(FoldersI18nKey.NoPermissions)
    : folderName === ROOT_FOLDER
      ? t(FoldersI18nKey.AllRules)
      : t(FoldersI18nKey.NoRules);
  const operatorNameClass = classNames(
    'border border-accent-primary rounded bg-accent-primary-alpha inline-block px-2',
  );

  return (
    <div>
      {isEmpty && isReadonly ? (
        <span className="small">{message}</span>
      ) : (
        <span className={operatorNameClass}>{t(FoldersI18nKey.Or)}</span>
      )}
    </div>
  );
};

export default RulesItemOperator;
