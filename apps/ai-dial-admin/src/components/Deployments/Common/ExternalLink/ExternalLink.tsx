'use client';

import { IconExternalLink } from '@tabler/icons-react';
import classNames from 'classnames';
import Link from 'next/link';
import { FC, MouseEvent } from 'react';

import { isValidHttpUrl } from '@/src/utils/validation/url-error';

interface Props {
  value?: string;
  className?: string;
}

const ExternalLink: FC<Props> = ({ value, className }) => {
  if (!value) {
    return null;
  }

  if (!isValidHttpUrl(value)) {
    return <span className={className}>{value}</span>;
  }

  const stopPropagation = (e: MouseEvent) => e.stopPropagation();

  return (
    <Link
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames('text-accent-primary hover:underline inline-flex items-center gap-1', className)}
      onClick={stopPropagation}
    >
      {value}
      <IconExternalLink size={14} />
    </Link>
  );
};

export default ExternalLink;
