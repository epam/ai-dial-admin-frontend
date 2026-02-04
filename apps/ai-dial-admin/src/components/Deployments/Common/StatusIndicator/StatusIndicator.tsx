'use client';
import { FC } from 'react';

import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { STATUS_I18N_KEYS } from '@/src/constants/deployments/images';
import { useI18n } from '@/src/locales/client';
import StatusIcon from '@/src/components/Deployments/Common/StatusIndicator/StatusIcon';

interface Props {
  status: IMAGE_STATUS | CONTAINER_STATUS;
}

const StatusIndicator: FC<Props> = ({ status }) => {
  const t = useI18n();

  return (
    <div className="flex items-center gap-2">
      <StatusIcon status={status} />
      <p className="flex-inline truncate">{t(STATUS_I18N_KEYS[status])}</p>
    </div>
  );
};

export default StatusIndicator;
