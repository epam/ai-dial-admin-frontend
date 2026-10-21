'use client';

import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { PrivilegeMark } from '@/src/components/Analytics/Tables/access/models';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  privilege: string;
  mark: PrivilegeMark;
}

const MARK_LABELS: Record<PrivilegeMark, AnalyticsTableAccessI18nKey> = {
  [PrivilegeMark.Stored]: AnalyticsTableAccessI18nKey.MarkStored,
  [PrivilegeMark.Implied]: AnalyticsTableAccessI18nKey.MarkImplied,
  [PrivilegeMark.None]: AnalyticsTableAccessI18nKey.MarkNone,
};

const PrivilegeMarkCell: FC<Props> = ({ privilege, mark }) => {
  const t = useI18n();

  return (
    <span role="img" aria-label={t(MARK_LABELS[mark], { privilege })} className="flex items-center">
      {mark === PrivilegeMark.None ? (
        <span aria-hidden className="text-secondary">
          ·
        </span>
      ) : (
        <IconCheck
          aria-hidden
          size={16}
          className={classNames(mark === PrivilegeMark.Stored ? 'text-accent-primary' : 'text-secondary opacity-60')}
        />
      )}
    </span>
  );
};

export default PrivilegeMarkCell;
