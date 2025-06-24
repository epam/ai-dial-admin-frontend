import { IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  children: ReactNode;
  width: string;
  title: string;
}
const CLOSED_WIDTH = '60';

const HorizontalCollapseBar: FC<Props> = ({ children, width, title }) => {
  const [containerWidth, setContainerWidth] = useState(width);
  const [isOpened, setIsOpened] = useState(true);

  const containerClass = classNames(
    `border border-primary rounded p-4 mr-4 flex flex-col justify-between overflow-y-auto`,
  );
  const bodyClass = isOpened ? '' : 'hidden';
  const titleClass = classNames(`transform rotate-180 [writing-mode:tb-rl] ${isOpened ? 'hidden' : ''}`);
  const buttonClass = classNames(`flex cursor-pointer ${isOpened ? 'justify-end' : 'justify-center'}`);

  const changeVisibility = () => {
    setContainerWidth(isOpened ? CLOSED_WIDTH : width);
    setIsOpened(!isOpened);
  };

  return (
    <div data-testid="collapseBarContainer" className={containerClass} style={{ width: `${containerWidth}px` }}>
      <div className={classNames('flex-1 min-h-0 overflow-auto', bodyClass)}> {children}</div>
      <div className={titleClass}> {title}</div>
      <div className={buttonClass}>
        <Button
          onClick={changeVisibility}
          iconBefore={isOpened ? <IconChevronsLeft {...BASE_ICON_PROPS} /> : <IconChevronsRight {...BASE_ICON_PROPS} />}
        />
      </div>
    </div>
  );
};

export default HorizontalCollapseBar;
