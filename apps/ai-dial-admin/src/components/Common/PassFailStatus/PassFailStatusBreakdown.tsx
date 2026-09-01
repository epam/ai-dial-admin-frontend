'use client';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { Icon } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode } from 'react';

import { STATUS_DOT_CLASSES, STATUS_DOT_ICONS } from '@/src/components/Common/PassFailStatus/constants';
import { PassFailErrorCounts } from '@/src/components/Common/PassFailStatus/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const STATUS_ICON_SIZE = 12;

interface StatusDotProps {
  className: string;
  count: number;
  icon: Icon;
  label: string;
  compact: boolean;
}

const StatusDot: FC<StatusDotProps> = ({ className, count, icon: StatusIcon, label, compact }) => (
  <span className={classNames('flex items-center gap-1', className)}>
    <StatusIcon aria-hidden="true" size={STATUS_ICON_SIZE} />
    {compact ? (
      <>
        <span>{count}</span>
        <span className="sr-only">{label}</span>
      </>
    ) : (
      <span>
        {count} {label}
      </span>
    )}
  </span>
);

interface Props {
  counts: PassFailErrorCounts;
  compact?: boolean;
  tooltipTitle?: string;
}

const PassFailStatusBreakdown: FC<Props> = ({ counts, compact = false, tooltipTitle }) => {
  const t = useI18n();

  const passLabel = t(RunsI18nKey.Pass);
  const failLabel = t(RunsI18nKey.Fail);
  const errorLabel = t(RunsI18nKey.ExecError);

  const breakdown = (
    <div
      className={classNames(
        'flex flex-wrap items-center gap-y-1',
        compact ? 'gap-x-2 dial-small-text' : 'gap-x-2 dial-tiny-text',
      )}
    >
      <StatusDot
        className={STATUS_DOT_CLASSES.pass}
        icon={STATUS_DOT_ICONS.pass}
        count={counts.passed}
        label={passLabel}
        compact={compact}
      />
      <StatusDot
        className={STATUS_DOT_CLASSES.fail}
        icon={STATUS_DOT_ICONS.fail}
        count={counts.failed}
        label={failLabel}
        compact={compact}
      />
      <StatusDot
        className={STATUS_DOT_CLASSES.error}
        icon={STATUS_DOT_ICONS.error}
        count={counts.error}
        label={errorLabel}
        compact={compact}
      />
    </div>
  );

  if (!tooltipTitle) {
    return breakdown;
  }

  const tooltipContent: ReactNode = (
    <div className="dial-tiny-text flex flex-col">
      <span>{tooltipTitle}</span>
      <span>
        • {counts.passed} {passLabel}
      </span>
      <span>
        • {counts.failed} {failLabel}
      </span>
      <span>
        • {counts.error} {errorLabel}
      </span>
    </div>
  );

  return (
    <DialTooltip tooltip={tooltipContent} placement="right" triggerClassName="inline-flex w-fit max-w-full self-start">
      {breakdown}
    </DialTooltip>
  );
};

export default PassFailStatusBreakdown;
