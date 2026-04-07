import { FC } from 'react';

import { DialLoader, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';
import { getStatusLabel } from './utils';

interface Props {
  status: RunStatus;
}

const RunStatusComponent: FC<Props> = ({ status }) => {
  const t = useI18n();
  const statusLabel = getStatusLabel(status, t);

  return (
    <div className="flex items-center gap-2">
      {status === RunStatus.COMPLETED && (
        <>
          <div className="size-[10px] rounded-full bg-accent-secondary"></div>
          <DialTooltip tooltip={statusLabel}>
            <span>{statusLabel}</span>
          </DialTooltip>
        </>
      )}
      {status === RunStatus.RUNNING && (
        <>
          <DialLoader size={12} className="size-2" />
          <span className="whitespace-nowrap">{statusLabel}</span>
        </>
      )}

      {status === RunStatus.FAILED && (
        <>
          <div className="size-[10px] rounded-full bg-error"></div>
          <DialTooltip tooltip={statusLabel}>
            <span>{statusLabel}</span>
          </DialTooltip>
        </>
      )}
    </div>
  );
};

export default RunStatusComponent;
