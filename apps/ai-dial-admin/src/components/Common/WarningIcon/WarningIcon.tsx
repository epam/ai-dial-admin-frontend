'use client';

import { FC } from 'react';

import { IconAlertTriangleFilled } from '@tabler/icons-react';
import { Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import classNames from 'classnames';

interface Props {
  warningText?: string;
}

const WarningIcon: FC<Props> = ({ warningText }) => {
  return (
    <Tooltip
      tooltip={warningText}
      placement={TooltipPlacement.Bottom}
      triggerClassName={warningText ? 'w-[20px]' : 'hidden'}
    >
      <IconAlertTriangleFilled
        {...BASE_BUTTON_ICON_PROPS}
        className={classNames('text-warning-icon', !warningText && 'hidden')}
      />
    </Tooltip>
  );
};

export default WarningIcon;
