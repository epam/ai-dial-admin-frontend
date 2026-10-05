import { FC, ReactNode } from 'react';

import classNames from 'classnames';

interface Props {
  label: string;
  className?: string;
  children: ReactNode;
}

/** One labelled fact about a group, as a term and its description inside a `<dl>`. */
const GroupFact: FC<Props> = ({ label, className, children }) => (
  <div className={classNames('flex min-w-0 flex-col gap-1', className)}>
    <dt className="dial-tiny-text uppercase tracking-wide text-secondary">{label}</dt>
    <dd className="min-w-0 dial-small-semi-text text-primary">{children}</dd>
  </div>
);

export default GroupFact;
