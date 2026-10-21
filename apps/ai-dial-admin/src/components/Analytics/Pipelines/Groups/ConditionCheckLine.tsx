'use client';

import { FC } from 'react';

import CheckValue from '@/src/components/Analytics/Pipelines/Groups/CheckValue';
import { nextUtcMidnight } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupCheck, GroupCondition } from '@/src/components/Analytics/Pipelines/Groups/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { formatSessionDuration } from '@/src/utils/analytics/session-formatting';

interface Props {
  check: GroupCheck;
  now: number;
}

// A span at or below zero is a row that landed this instant, or a runner clock slightly ahead of this one; either
// way it is no time at all, which the session formatter would render as unavailable.
const span = (ms?: number): string => {
  if (ms == null) return '—';
  return ms > 0 ? formatSessionDuration(ms) : '0s';
};

/** What one check states, worded for its condition: a label, the group's value set apart, then a hint. */
const ConditionCheckLine: FC<Props> = ({ check, now }) => {
  const t = useI18n();

  switch (check.condition) {
    case GroupCondition.Idle:
      return (
        <>
          {t(AnalyticsPipelinesI18nKey.GroupsCheckIdle)}{' '}
          <CheckValue text={`${span(check.value)} / ${span(check.threshold)}`} />
          {!check.isSatisfied && check.remaining ? (
            <span className="text-secondary">
              {' · '}
              {t(AnalyticsPipelinesI18nKey.GroupsCheckIdleLeft, { remaining: span(check.remaining) })}
            </span>
          ) : null}
        </>
      );
    case GroupCondition.DefaultIdle:
      return (
        <>
          {t(AnalyticsPipelinesI18nKey.GroupsCheckDefaultIdle)} <CheckValue text={span(check.value)} />
        </>
      );
    case GroupCondition.Signal:
      return (
        <>
          {t(
            check.isSatisfied
              ? AnalyticsPipelinesI18nKey.GroupsCheckSignalMet
              : AnalyticsPipelinesI18nKey.GroupsCheckSignalNotMet,
          )}
        </>
      );
    case GroupCondition.MaxStaleness:
      return check.value == null ? (
        <span className="text-secondary">{t(AnalyticsPipelinesI18nKey.GroupsCheckStalenessNone)}</span>
      ) : (
        <>
          {t(AnalyticsPipelinesI18nKey.GroupsCheckStaleness)}{' '}
          <CheckValue text={`${span(check.value)} / ${span(check.threshold)}`} />
        </>
      );
    case GroupCondition.CostCeiling:
      return (
        <>
          {t(AnalyticsPipelinesI18nKey.GroupsCheckCeiling)}{' '}
          <CheckValue text={`${check.value ?? 0} / ${check.threshold ?? 0}`} />
          {!check.isSatisfied && (
            <span className="text-secondary">
              {' · '}
              {t(AnalyticsPipelinesI18nKey.GroupsCheckCeilingReset, { remaining: span(nextUtcMidnight(now) - now) })}
            </span>
          )}
        </>
      );
  }
};

export default ConditionCheckLine;
