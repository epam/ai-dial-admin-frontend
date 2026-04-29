'use client';

import { FC } from 'react';

import { IconAlertTriangleFilled } from '@tabler/icons-react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import classNames from 'classnames';

interface Props {
  warningText?: string;
}

const WarningIcon: FC<Props> = ({ warningText }) => {
  return (
    <DialTooltip tooltip={warningText} placement="bottom" triggerClassName={warningText ? 'w-[20px]' : 'hidden'}>
      <IconAlertTriangleFilled
        {...BASE_BUTTON_ICON_PROPS}
        className={classNames('text-warning-icon', !warningText && 'hidden')}
      />
    </DialTooltip>
  );
};

export default WarningIcon;
