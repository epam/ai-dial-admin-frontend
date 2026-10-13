'use client';

import { FC, useState } from 'react';

import { Button, ButtonVariant } from '@epam/ai-dial-ui-kit';

import BackfillRangeField from '@/src/components/Analytics/Common/BackfillSidebar/BackfillRangeField';
import { BackfillRange } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillRangeIssue } from '@/src/models/analytics/backfill-ui';
import { PipelineBackfillRequest } from '@/src/models/analytics/pipeline-backfill';
import { getBackfillRangeIssue, getDayWindowMoments, getTodayUtc } from '@/src/utils/analytics/backfill';

interface Props {
  isBusy: boolean;
  onStart: (window: PipelineBackfillRequest) => void;
}

/**
 * Whole UTC days, sent as moments (see `getDayWindowMoments`). There is deliberately no way to replay the whole
 * history from here: a run over a bounded window is cheap to repeat and to cancel, one over everything is neither.
 * The pipeline's window has no span limit.
 */
const PipelineBackfillStartForm: FC<Props> = ({ isBusy, onStart }) => {
  const t = useI18n();
  const [range, setRange] = useState<BackfillRange>({ from: '', to: '' });

  const today = getTodayUtc(new Date());
  const issue = getBackfillRangeIssue(range.from, range.to, today);
  const shownIssue = issue === BackfillRangeIssue.Missing ? null : issue;
  const canStart = issue === null && !isBusy;

  return (
    <form
      className="flex flex-col gap-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (canStart) onStart(getDayWindowMoments(range.from, range.to));
      }}
    >
      <BackfillRangeField value={range} onChange={setRange} today={today} issue={shownIssue} isDisabled={isBusy} />
      <Button type="submit" variant={ButtonVariant.Primary} label={t(BackfillI18nKey.Start)} disabled={!canStart} />
    </form>
  );
};

export default PipelineBackfillStartForm;
