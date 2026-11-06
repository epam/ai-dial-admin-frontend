import classNames from 'classnames';
import Link from 'next/link';
import { FC, ReactNode } from 'react';

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
}

const EntityLinkCell: FC<Props> = ({ href, children, className }) => (
  <Link
    href={href}
    prefetch={false}
    className={classNames(
      'inline-block w-fit min-w-0 max-w-full self-start rounded text-accent hover:underline focus-visible:underline focus-visible:outline focus-visible:outline-focus',
      className,
    )}
  >
    {children}
  </Link>
);

export default EntityLinkCell;
