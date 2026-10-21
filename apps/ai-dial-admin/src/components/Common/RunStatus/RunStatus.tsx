import classNames from 'classnames';
import { FC } from 'react';

import { DialLoader, Tooltip } from '@epam/ai-dial-ui-kit';

import { STATUS_BADGE_TONES } from '@/src/components/Common/StatusBadge/constants';
import { StatusBadgeLeading } from '@/src/components/Common/StatusBadge/models';
import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';
import { getRunStatusPresentation, getStatusLabel } from './utils';

interface Props {
  status?: RunStatus | string;
  /** Dense surfaces (a list row) show the indicator only; the label stays in the tooltip and the a11y tree. */
  isLabelHidden?: boolean;
}

const RunStatusComponent: FC<Props> = ({ status, isLabelHidden }) => {
  const t = useI18n();

  if (!status) {
    return null;
  }

  const statusLabel = getStatusLabel(status, t);
  const { tone, leading } = getRunStatusPresentation(status);
  const isTransitional = leading === StatusBadgeLeading.Spinner;

  const indicator = isTransitional ? (
    <DialLoader size={12} className="size-2" />
  ) : (
    <div className={classNames('size-[10px] rounded-full bg-[currentColor]', STATUS_BADGE_TONES[tone].textClassName)} />
  );

  if (isLabelHidden) {
    return (
      <div className="flex size-full items-center justify-center">
        <Tooltip tooltip={statusLabel}>
          <span className="flex items-center">
            {indicator}
            <span className="sr-only">{statusLabel}</span>
          </span>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {indicator}
      {isTransitional ? (
        <span className="whitespace-nowrap">{statusLabel}</span>
      ) : (
        <Tooltip tooltip={statusLabel}>
          <span>{statusLabel}</span>
        </Tooltip>
      )}
    </div>
  );
};

export default RunStatusComponent;
