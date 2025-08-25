'use client';

import { FC } from 'react';

import { IconAlertTriangleFilled } from '@tabler/icons-react';

import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  endpointWarning?: string;
}

const WarningIcon: FC<Props> = ({ endpointWarning }) => {
  return (
    <Tooltip tooltip={endpointWarning} placement={'bottom'}>
      <IconAlertTriangleFilled fill="#F4CE46" {...BASE_ICON_PROPS} className={endpointWarning ? '' : 'hidden'} />
    </Tooltip>
  );
};

export default WarningIcon;
