'use client';

import { FC, useState } from 'react';

import { Button, ButtonVariant } from '@epam/ai-dial-ui-kit';

import BackfillRangeField from '@/src/components/Analytics/Common/BackfillSidebar/BackfillRangeField';
import { BackfillRange } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import TableBackfillReingestField from '@/src/components/Analytics/Tables/Backfill/TableBackfillReingestField';
import { TABLE_BACKFILL_MAX_DAYS } from '@/src/constants/analytics/backfill';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillRangeIssue } from '@/src/models/analytics/backfill-ui';
import { getBackfillRangeIssue, getTodayUtc } from '@/src/utils/analytics/backfill';

interface Props {
  isStarting: boolean;
  onStart: (range: BackfillRange, shouldIncludeIngested: boolean) => void;
}

/**
 * Two inclusive UTC dates and a Start control that stays off while the range cannot be sent. Offered only while no
 * run is in progress, since the service would refuse a second. The span limit is stated only in the message for a
 * range over it; the service's own refusal is the backstop.
 */
const TableBackfillStartForm: FC<Props> = ({ isStarting, onStart }) => {
  const t = useI18n();
  const [range, setRange] = useState<BackfillRange>({ from: '', to: '' });
  const [shouldIncludeIngested, setShouldIncludeIngested] = useState(false);

  const issue = getBackfillRangeIssue(range.from, range.to, getTodayUtc(new Date()), TABLE_BACKFILL_MAX_DAYS);
  // An empty form is not an error to show, only a Start to withhold.
  const shownIssue = issue === BackfillRangeIssue.Missing ? null : issue;

  return (
    <form
      className="flex flex-col gap-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (issue === null) onStart(range, shouldIncludeIngested);
      }}
    >
      <BackfillRangeField
        value={range}
        onChange={setRange}
        today={getTodayUtc(new Date())}
        issue={shownIssue}
        isDisabled={isStarting}
        maxDays={TABLE_BACKFILL_MAX_DAYS}
      />
      <TableBackfillReingestField
        caption={t(BackfillI18nKey.ReingestCaption)}
        isSelected={shouldIncludeIngested}
        isDisabled={isStarting}
        onChange={setShouldIncludeIngested}
      />
      <Button
        type="submit"
        variant={ButtonVariant.Primary}
        label={t(BackfillI18nKey.Start)}
        disabled={issue !== null || isStarting}
      />
    </form>
  );
};

export default TableBackfillStartForm;
