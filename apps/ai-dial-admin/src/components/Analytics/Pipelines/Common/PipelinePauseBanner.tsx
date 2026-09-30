'use client';

import { FC, useEffect, useState } from 'react';

import {
  Button,
  ButtonVariant,
  ElementSize,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';

import { IconPlayerPlay } from '@tabler/icons-react';

import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { PausedPipeline, PauseOrigin } from '@/src/models/analytics/pipeline-runtime';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

/** The banner states the pause's age in minutes, so it re-reads the clock at that resolution. */
const MINUTE_TICK_MS = 60_000;

interface Props {
  pause: PausedPipeline;
  isResuming: boolean;
  onResume: () => void;
}

/**
 * States a pause wherever the reader is, because it changes how everything else on the page reads: a
 * failure reported by a pipeline that is no longer consuming its input is a different fact from one
 * reported by a pipeline still trying.
 *
 * It names no author. The runner records the origin and the reason it wrote at the time and no user
 * identity, so a name here could only be invented.
 *
 * A breaker pause carries the time it lifts itself. That time is stated rather than counted down to: the
 * runner lifts an expired pause lazily, on the next read, so between expiry and that read the value is
 * already in the past and a countdown would run negative.
 */
const PipelinePauseBanner: FC<Props> = ({ pause, isResuming, onResume }) => {
  const t = useI18n();

  const resumesAt = useLocalDateTimeString(pause.resumesAt);

  const [now, setNow] = useState(() => Date.now());

  // Once a minute, not once a second: `formatRelativeTime`'s smallest unit is the minute, so a 1 Hz
  // tick re-rendered the banner sixty times for every string it could change.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), MINUTE_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const isBreaker = pause.origin === PauseOrigin.Breaker;

  const message = [
    t(AnalyticsPipelinesI18nKey.PausedBanner),
    isBreaker ? t(AnalyticsPipelinesI18nKey.PausedByBreaker) : null,
    isBreaker && resumesAt ? t(AnalyticsPipelinesI18nKey.PausedResumesAt, { time: resumesAt }) : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Notification
      variant={NotificationVariant.Warning}
      type={NotificationType.SectionMessage}
      role="status"
      title={t(AnalyticsPipelinesI18nKey.PausedBannerTitle, { age: formatRelativeTime(pause.since, now) })}
      message={message}
      action={
        <Button
          variant={ButtonVariant.Primary}
          size={ElementSize.Small}
          iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          label={t(isResuming ? AnalyticsPipelinesI18nKey.Resuming : AnalyticsPipelinesI18nKey.Resume)}
          disabled={isResuming}
          onClick={onResume}
        />
      }
    />
  );
};

export default PipelinePauseBanner;
