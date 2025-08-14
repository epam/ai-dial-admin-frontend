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
  if (hideTooltip || !tooltip) {
    return <span className={triggerClassName}>{children}</span>;
  }

  return (
    <TooltipContainer {...tooltipProps}>
      <TooltipTrigger className={classNames(triggerClassName, 'flex-1 min-w-0 truncate')}>{children}</TooltipTrigger>
      <TooltipContent className={classNames(contentClassName, 'max-w-[300px]')}>{tooltip}</TooltipContent>
    </TooltipContainer>
  );
};

export default Tooltip;
