import classNames from 'classnames';
import { FC } from 'react';

import { DialLoader, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';
import { getStatusLabel, isTransitionalRunStatus } from './utils';

interface Props {
  status?: RunStatus | string;
}

const SETTLED_STATUS_DOT_CLASS: Partial<Record<RunStatus, string>> = {
  [RunStatus.COMPLETED]: 'bg-accent-secondary',
  [RunStatus.FAILED]: 'bg-error',
  [RunStatus.CANCELLED]: 'bg-secondary',
};

const RunStatusComponent: FC<Props> = ({ status }) => {
  const t = useI18n();

  if (!status) {
    return null;
  }

  const statusLabel = getStatusLabel(status, t);
  const dotClass = SETTLED_STATUS_DOT_CLASS[status as RunStatus] ?? 'bg-secondary';

  return (
    <div className="flex items-center gap-2">
      {isTransitionalRunStatus(status) ? (
        <>
          <DialLoader size={12} className="size-2" />
          <span className="whitespace-nowrap">{statusLabel}</span>
        </>
      ) : (
        <>
          <div className={classNames('size-[10px] rounded-full', dotClass)}></div>
          <DialTooltip tooltip={statusLabel}>
            <span>{statusLabel}</span>
          </DialTooltip>
        </>
      )}
    </div>
  );
};

export default RunStatusComponent;
