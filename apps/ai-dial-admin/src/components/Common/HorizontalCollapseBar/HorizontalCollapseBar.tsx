import { FC, ReactNode, useState } from 'react';

import { IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  children: ReactNode;
  width: string;
  title: string;
  containerClass?: string;
  iconSize?: number;
  additionalButtons?: ReactNode;
}
const CLOSED_WIDTH = '60';

const HorizontalCollapseBar: FC<Props> = ({ containerClass, children, width, title, iconSize, additionalButtons }) => {
  const [containerWidth, setContainerWidth] = useState(width);
  const [isOpened, setIsOpened] = useState(true);

  const bodyClass = isOpened ? '' : 'hidden';
  const titleClass = classNames(`transform rotate-180 [writing-mode:tb-rl] ${isOpened ? 'hidden' : ''}`);
  const buttonClass = classNames(
    `flex flex-row gap-2 cursor-pointer text-secondary ${isOpened ? 'justify-end' : 'justify-center'}`,
  );

  const changeVisibility = () => {
    setContainerWidth(isOpened ? CLOSED_WIDTH : width);
    setIsOpened(!isOpened);
  };

  return (
    <div
      className={classNames(
        `border rounded p-4 flex flex-col justify-between overflow-y-auto flex-shrink-0`,
        containerClass,
      )}
      style={{ width: `${containerWidth}px` }}
    >
      <div className={classNames('flex-1 min-h-0 overflow-auto', bodyClass)}> {children}</div>
      <div className={titleClass}> {title}</div>
      <div className={buttonClass}>
        {isOpened && additionalButtons}
        <Button
          cssClass={'hover:text-icon-accent-primary'}
          onClick={changeVisibility}
          iconBefore={
            isOpened ? (
              <IconChevronsLeft
                width={iconSize || BASE_ICON_PROPS.width}
                height={iconSize || BASE_ICON_PROPS.height}
                stroke={BASE_ICON_PROPS.stroke}
              />
            ) : (
              <IconChevronsRight
                width={iconSize || BASE_ICON_PROPS.width}
                height={iconSize || BASE_ICON_PROPS.height}
                stroke={BASE_ICON_PROPS.stroke}
              />
            )
          }
        />
      </div>
    </div>
  );
};

export default HorizontalCollapseBar;
