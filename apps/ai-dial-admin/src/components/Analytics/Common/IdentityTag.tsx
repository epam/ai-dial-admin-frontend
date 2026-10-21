import { FC, ReactNode } from 'react';

import classNames from 'classnames';

import { CHIP_CLASS } from '@/src/components/Analytics/Common/constants';

interface Props {
  label: ReactNode;
  /** A text colour token; the background is always the neutral layer. */
  colorClassName?: string;
  className?: string;
}

/** A fixed fact about what something is — a type, a kind, a trigger — drawn square on a neutral layer. */
const IdentityTag: FC<Props> = ({ label, colorClassName = 'text-secondary', className }) => (
  <span className={classNames(CHIP_CLASS, 'rounded bg-layer-4', colorClassName, className)}>{label}</span>
);

export default IdentityTag;
