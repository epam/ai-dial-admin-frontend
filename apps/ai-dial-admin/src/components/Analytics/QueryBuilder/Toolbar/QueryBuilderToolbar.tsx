'use client';

import { FC, ReactNode } from 'react';

import { PrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';

import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  onRun: () => void;
  runDisabled: boolean;
  showRun?: boolean;
  children?: ReactNode;
}

const QueryBuilderToolbar: FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  onRun,
  runDisabled,
  showRun = true,
  children,
}) => {
  const t = useI18n();

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
      <div className="flex flex-1 items-center justify-end gap-4">
        {children}
        {showRun && (
          <PrimaryButton
            label={t(QueryBuilderI18nKey.Run)}
            iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />}
            disabled={runDisabled}
            onClick={onRun}
          />
        )}
      </div>
    </div>
  );
};

export default QueryBuilderToolbar;
