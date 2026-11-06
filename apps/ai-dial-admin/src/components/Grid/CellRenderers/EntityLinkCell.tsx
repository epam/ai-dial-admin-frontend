import classNames from 'classnames';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  isNewTab?: boolean;
}

const EntityLinkCell: FC<Props> = ({ href, children, className, isNewTab }) => (
  <Link
    href={href}
    prefetch={false}
    target={isNewTab ? '_blank' : undefined}
    rel={isNewTab ? 'noopener noreferrer' : undefined}
    className={classNames(
      'inline-block w-fit min-w-0 max-w-full self-start rounded text-accent hover:underline focus-visible:underline focus-visible:outline focus-visible:outline-focus',
      className,
    )}
  >
    {children}
  </Link>
);

export default EntityLinkCell;
