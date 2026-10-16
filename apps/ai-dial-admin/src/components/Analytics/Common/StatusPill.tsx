import { FC, HTMLAttributes, ReactNode, Ref } from 'react';

import classNames from 'classnames';

import { CHIP_CLASS } from '@/src/components/Analytics/Common/constants';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  label: ReactNode;
  /** A text-and-background pair from the theme tokens, e.g. `text-success bg-success`. */
  toneClassName: string;
  ref?: Ref<HTMLSpanElement>;
}

/** A state that changes — table status, run status, enabled — drawn round and tinted, unlike an identity tag. */
const StatusPill: FC<Props> = ({ label, toneClassName, className, ref, ...rest }) => (
  <span ref={ref} {...rest} className={classNames(CHIP_CLASS, 'rounded-full', toneClassName, className)}>
    {label}
  </span>
);

export default StatusPill;
