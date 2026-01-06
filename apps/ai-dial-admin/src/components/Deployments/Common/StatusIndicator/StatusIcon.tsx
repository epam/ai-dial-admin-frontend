'use client';
import { FC } from 'react';
import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { getActionClass } from '@/src/utils/deployments/images';

interface Props {
  status: IMAGE_STATUS | CONTAINER_STATUS;
}

const StatusIcon: FC<Props> = ({ status }) => {
  const indicatorClassNames = classNames('flex w-2 h-2 rounded no-user-select', getActionClass(status));

  return (
    <div>
      {status === IMAGE_STATUS.BUILDING ||
      status === CONTAINER_STATUS.PENDING ||
      status === CONTAINER_STATUS.STOPPING ? (
        <DialLoader size={12} className="w-2 h-2" />
      ) : (
        <span className={indicatorClassNames} />
      )}
    </div>
  );
};

export default StatusIcon;
