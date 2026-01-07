'use client';

import { FC } from 'react';

import { IconAlertTriangleFilled } from '@tabler/icons-react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import classNames from 'classnames';

interface Props {
  endpointWarning?: string;
}

const WarningIcon: FC<Props> = ({ endpointWarning }) => {
  return (
    <DialTooltip
      tooltip={endpointWarning}
      placement="bottom"
      triggerClassName={endpointWarning ? 'w-[20px]' : 'hidden'}
    >
      <IconAlertTriangleFilled
        {...BASE_BUTTON_ICON_PROPS}
        className={classNames('text-warning-icon', !endpointWarning && 'hidden')}
      />
    </DialTooltip>
  );
};

export default WarningIcon;
