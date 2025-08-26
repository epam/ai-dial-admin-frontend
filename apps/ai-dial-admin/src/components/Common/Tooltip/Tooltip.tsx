import { FC, ReactNode } from 'react';
import classNames from 'classnames';

import TooltipTrigger from './TooltipTrigger';
import TooltipContainer, { TooltipContainerOptions } from './TooltipContext';
import TooltipContent from './TooltipContent';

interface Props extends TooltipContainerOptions {
  hideTooltip?: boolean;
  tooltip: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
}

const Tooltip: FC<Props> = ({
  hideTooltip,
  tooltip,
  children,
  triggerClassName,
  contentClassName,
  ...tooltipProps
}) => {
  return (
    <TooltipContainer {...tooltipProps}>
      <TooltipTrigger className={classNames(triggerClassName, 'w-full truncate')}>{children}</TooltipTrigger>
      <TooltipContent className={classNames(contentClassName, 'max-w-[300px]', (hideTooltip || !tooltip) && 'hidden')}>
        {tooltip}
      </TooltipContent>
    </TooltipContainer>
  );
};

export default Tooltip;
