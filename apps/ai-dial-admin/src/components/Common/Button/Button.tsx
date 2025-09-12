'use client';

import classNames from 'classnames';
import { FC, MouseEvent, ReactNode, Ref } from 'react';

interface Props {
  cssClass?: string;
  disable?: boolean;
  title?: string;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  hideTitleOnMobile?: boolean;
  ariaLabel?: string;
}

const Button: FC<Props> = ({
  title,
  cssClass,
  ref,
  onClick,
  disable,
  iconAfter,
  iconBefore,
  hideTitleOnMobile,
  ariaLabel,
}) => {
  const btnTextClassNames = classNames(
    'small-text-semi',
    iconAfter ? 'mr-2' : '',
    iconBefore ? 'ml-2' : '',
    hideTitleOnMobile ? 'hidden sm:inline' : 'inline',
  );
  const btnClassNames = classNames(cssClass, 'focus-visible:outline outline-offset-0');

  return (
    <button
      ref={ref}
      type="button"
      className={btnClassNames}
      onClick={(e) => onClick?.(e)}
      disabled={disable}
      aria-label={title || ariaLabel}
    >
      {iconBefore}
      {title && <span className={btnTextClassNames}>{title}</span>}
      {iconAfter}
    </button>
  );
};

export default Button;
