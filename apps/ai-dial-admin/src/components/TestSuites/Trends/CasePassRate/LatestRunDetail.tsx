'use client';

import { IconTriangleFilled, IconTriangleInvertedFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';
import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { CasePassRateLatestDetail } from '@/src/components/TestSuites/Trends/models';
import { formatTrendTooltipDate } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const DELTA_ICON_SIZE = 10;

interface Props {
  detail: CasePassRateLatestDetail;
}

/** Numeric readout for the newest run in the window — never an aggregate across runs. */
const LatestRunDetail: FC<Props> = ({ detail }) => {
  const t = useI18n();
  const { bar, passedDelta, isLackingScoring } = detail;
  const isDeltaPositive = passedDelta != null && passedDelta >= 0;
  const counts = {
    passed: bar.passedCount,
    failed: bar.failedCount,
    error: bar.erroredCount,
    total: bar.totalCount,
  };
  const DeltaIcon = isDeltaPositive ? IconTriangleFilled : IconTriangleInvertedFilled;

  return (
    <div className="flex flex-col gap-3">
      {/*
        At xl and above this heading lives in the card header, aligned with the card title, so the
        readout starts a row higher and the card is shorter. Below xl the columns stack, where a
        heading in the header would sit far from the content it names.
      */}
      <p className="dial-body-semi-text text-primary xl:hidden">{t(TestSuitesI18nKey.CasePassRateLatestRun)}</p>

      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        {bar.href ? (
          <a href={bar.href} className="dial-body-semi-text truncate text-accent-primary hover:underline">
            {bar.label}
          </a>
        ) : (
          <span className="dial-body-semi-text truncate text-primary">{bar.label}</span>
        )}
        {bar.createdAtMs != null && (
          <span className="dial-small-text text-secondary">{formatTrendTooltipDate(bar.createdAtMs)}</span>
        )}
      </div>

      {isLackingScoring ? (
        <p className="dial-body-text text-secondary">{t(TestSuitesI18nKey.CasePassRateLackScoring)}</p>
      ) : (
        <div className="flex flex-col">
          <PassFailFraction counts={counts} />
          <p className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.CasesPassedCaption)}</p>
        </div>
      )}

      <PassFailStatusBreakdown counts={counts} notScored={bar.notScoredCount} isVertical />

      {passedDelta != null && (
        <span
          className={classNames(
            'dial-small-text flex w-fit items-center gap-1.5 rounded px-2.5 py-1.5',
            isDeltaPositive ? 'bg-accent-secondary-alpha text-accent-secondary' : 'bg-error text-error',
          )}
        >
          <DeltaIcon size={DELTA_ICON_SIZE} aria-hidden />
          {isDeltaPositive ? `+${passedDelta}` : passedDelta} {t(TestSuitesI18nKey.CasePassRateVsPrev)}
        </span>
      )}
    </div>
  );
};

export default LatestRunDetail;
