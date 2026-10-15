import { FC, ReactNode } from 'react';

import classNames from 'classnames';

import ReadonlyId from '@/src/components/BaseControls/Id/ReadonlyId';
import StatusBadge from '@/src/components/Common/StatusBadge/StatusBadge';
import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CoreResourceValidity } from '@/src/models/dial/resource';
import { getOverallStatusBadgeProps } from '@/src/utils/entities/overall-status';

interface Props {
  id: string;
  metadata?: CoreResourceValidity;
  /** Rendered between the overall status badge and the id — the sync status slot. */
  children?: ReactNode;
}

const HeaderIdBlock: FC<Props> = ({ id, metadata, children }) => {
  const t = useI18n();
  const badgeProps = getOverallStatusBadgeProps(metadata, {
    valid: t(StatusBadgeI18nKey.Valid),
    invalid: t(StatusBadgeI18nKey.Invalid),
  });

  return (
    <div className={classNames('flex flex-col min-w-0', badgeProps ? 'gap-2' : 'gap-0.5')}>
      {badgeProps && <StatusBadge {...badgeProps} />}
      {children}
      <ReadonlyId value={id} />
    </div>
  );
};

export default HeaderIdBlock;
