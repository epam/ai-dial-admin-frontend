'use client';

import { FC } from 'react';

import classNames from 'classnames';

interface Props {
  label: string;
  isPositive: boolean;
}

/** Diff pill styled like the kit card's own `delta` badge, for figures the kit cannot format (`-$10`). */
const DeltaBadge: FC<Props> = ({ label, isPositive }) => (
  <span
    className={classNames(
      'dial-tiny-semi-text rounded-[120px] border border-transparent px-2',
      isPositive ? 'bg-success text-success' : 'bg-error text-error',
    )}
  >
    {label}
  </span>
);

export default DeltaBadge;
