import { FC, ReactNode } from 'react';

import { InfoButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { BackfillTone } from '@/src/models/analytics/backfill-ui';

interface Props {
  label: string;
  children: ReactNode;
  isWide?: boolean;
  hint?: string;
  tone?: BackfillTone;
}

/** One labelled fact of a run. */
const BackfillRow: FC<Props> = ({ label, children, isWide, hint, tone }) => (
  <div className={classNames('flex flex-col gap-y-1', isWide && 'col-span-2')}>
    <dt className="flex items-center gap-x-1 text-secondary dial-tiny">
      {label}
      {hint && <InfoButton caption={hint} />}
    </dt>
    <dd
      className={classNames('m-0 dial-small break-words', {
        'text-primary': !tone,
        'text-success': tone === BackfillTone.Success,
        'text-error': tone === BackfillTone.Error,
      })}
    >
      {children}
    </dd>
  </div>
);

export default BackfillRow;
