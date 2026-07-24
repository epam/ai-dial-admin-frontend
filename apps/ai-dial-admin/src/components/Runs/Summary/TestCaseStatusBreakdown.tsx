'use client';

import { Icon } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import { STATUS_DOT_CLASSES, STATUS_DOT_ICONS } from '@/src/components/Runs/Summary/constants';
import { TestCaseStatusCounts } from '@/src/components/Runs/Summary/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface StatusDotProps {
  className: string;
  count: number;
  icon: Icon;
  label: string;
  compact: boolean;
}

const StatusDot: FC<StatusDotProps> = ({ className, count, icon: StatusIcon, label, compact }) => (
  <span className={classNames('flex items-center gap-1', className)}>
    <StatusIcon aria-hidden="true" size={compact ? 12 : 14} />
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
  counts: TestCaseStatusCounts;
  /** When true, shows count only (label is screen-reader only). */
  compact?: boolean;
}

const TestCaseStatusBreakdown: FC<Props> = ({ counts, compact = false }) => {
  const t = useI18n();

  return (
    <div className={classNames('flex flex-wrap items-center gap-y-1', compact ? 'gap-x-2 dial-small-text' : 'gap-x-3')}>
      <StatusDot
        className={STATUS_DOT_CLASSES.pass}
        icon={STATUS_DOT_ICONS.pass}
        count={counts.passed}
        label={t(RunsI18nKey.Pass)}
        compact={compact}
      />
      <StatusDot
        className={STATUS_DOT_CLASSES.fail}
        icon={STATUS_DOT_ICONS.fail}
        count={counts.failed}
        label={t(RunsI18nKey.Fail)}
        compact={compact}
      />
      <StatusDot
        className={STATUS_DOT_CLASSES.error}
        icon={STATUS_DOT_ICONS.error}
        count={counts.error}
        label={t(RunsI18nKey.ExecError)}
        compact={compact}
      />
    </div>
  );
};

export default TestCaseStatusBreakdown;
