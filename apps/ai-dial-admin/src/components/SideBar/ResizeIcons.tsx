import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { FC } from 'react';

interface ResizeIconProps {
  className: string;
}

export const LeftSideBarResizeIcon: FC<ResizeIconProps> = ({ className }) => {
  return (
    <div className={className}>
      <IconChevronLeft className="-ml-6 h-full" />
    </div>
  );
};

export const RightSideBarResizeIcon: FC<ResizeIconProps> = ({ className }) => {
  return (
    <div className={className}>
      <IconChevronRight className="h-full" />
    </div>
  );
};
