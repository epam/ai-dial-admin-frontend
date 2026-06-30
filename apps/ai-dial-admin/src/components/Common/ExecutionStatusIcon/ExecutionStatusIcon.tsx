'use client';

import { FC } from 'react';

import { IconAlertCircle, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import classNames from 'classnames';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';

interface StatusIconConfig {
  Icon: typeof IconCheck;
  className: string;
}

export const EXECUTION_STATUS_ICON_CONFIG: Record<ExtractionResultStatus, StatusIconConfig> = {
  [ExtractionResultStatus.SUCCESS]: { Icon: IconCheck, className: 'text-success' },
  [ExtractionResultStatus.FAILED]: { Icon: IconX, className: 'text-error' },
  [ExtractionResultStatus.TIMEOUT]: { Icon: IconClock, className: 'text-warning' },
  [ExtractionResultStatus.ERROR]: { Icon: IconAlertCircle, className: 'text-error' },
};

interface Props {
  status: ExtractionResultStatus;
  size?: number;
}

const ExecutionStatusIcon: FC<Props> = ({ status, size = 18 }) => {
  const config = EXECUTION_STATUS_ICON_CONFIG[status];
  if (!config) {
    return null;
  }

  const { Icon, className } = config;
  return <Icon className={classNames('shrink-0', className)} size={size} />;
};

export default ExecutionStatusIcon;
