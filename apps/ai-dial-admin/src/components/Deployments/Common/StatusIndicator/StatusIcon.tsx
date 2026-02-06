'use client';
import { FC, useMemo } from 'react';
import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { getActionClass } from '@/src/utils/deployments/images';
import { LOADING_STATUSES, STATUS_I18N_KEYS } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';

interface Props {
  status: IMAGE_STATUS | CONTAINER_STATUS;
}

const StatusIcon: FC<Props> = ({ status }) => {
  const t = useI18n();
  const indicatorClassNames = classNames('flex w-2 h-2 rounded no-user-select', getActionClass(status));

  const statusLabel = useMemo(() => t(STATUS_I18N_KEYS[status]), [status, t]);

  return (
    <div>
      {LOADING_STATUSES.includes(status) ? (
        <DialLoader ariaLabel={statusLabel} size={12} className="w-2 h-2" />
      ) : (
        <span role="status" aria-label={statusLabel} className={indicatorClassNames} />
      )}
    </div>
  );
};

export default StatusIcon;
