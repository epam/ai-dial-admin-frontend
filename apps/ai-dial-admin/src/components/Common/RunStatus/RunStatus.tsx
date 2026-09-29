import classNames from 'classnames';
import { FC } from 'react';

import { DialLoader, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';
import { getStatusLabel, isTransitionalRunStatus } from './utils';

interface Props {
  status?: RunStatus | string;
  /** Dense surfaces (a list row) show the indicator only; the label stays in the tooltip and the a11y tree. */
  isLabelHidden?: boolean;
}

const SETTLED_STATUS_DOT_CLASS: Partial<Record<RunStatus, string>> = {
  [RunStatus.COMPLETED]: 'bg-accent-secondary',
  [RunStatus.FAILED]: 'bg-error',
  [RunStatus.CANCELLED]: 'bg-secondary',
};

const RunStatusComponent: FC<Props> = ({ status, isLabelHidden }) => {
  const t = useI18n();

  if (!status) {
    return null;
  }

  const statusLabel = getStatusLabel(status, t);
  const dotClass = SETTLED_STATUS_DOT_CLASS[status as RunStatus] ?? 'bg-secondary';
  const isTransitional = isTransitionalRunStatus(status);

  const indicator = isTransitional ? (
    <DialLoader size={12} className="size-2" />
  ) : (
    <div className={classNames('size-[10px] rounded-full', dotClass)}></div>
  );

  if (isLabelHidden) {
    return (
      <div className="flex size-full items-center">
        <DialTooltip tooltip={statusLabel}>
          <span className="flex items-center">
            {indicator}
            <span className="sr-only">{statusLabel}</span>
          </span>
        </DialTooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {indicator}
      {isTransitional ? (
        <span className="whitespace-nowrap">{statusLabel}</span>
      ) : (
        <DialTooltip tooltip={statusLabel}>
          <span>{statusLabel}</span>
        </DialTooltip>
      )}
    </div>
  );
};

export default RunStatusComponent;
