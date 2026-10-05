'use client';

import { FC } from 'react';

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
import { useMinuteTick } from '@/src/hooks/use-minute-tick';
import { useI18n } from '@/src/locales/client';
import { PipelinePause, PauseOrigin } from '@/src/models/analytics/pipeline-runtime';
import { formatRelativeTime } from '@/src/utils/analytics/session-formatting';

interface Props {
  pause: PipelinePause;
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
 * It states how long the pause has lasted only where the service said. The runtime view holds that
 * instant in memory, so a restart can lose it while the pause itself survives — and a banner withheld
 * for a missing timestamp would withhold the only Resume control on the page with it.
 *
 * A breaker pause carries the time it lifts itself. That time is stated rather than counted down to: the
 * runner lifts an expired pause lazily, on the next read, so between expiry and that read the value is
 * already in the past and a countdown would run negative.
 */
const PipelinePauseBanner: FC<Props> = ({ pause, isResuming, onResume }) => {
  const t = useI18n();

  const resumesAt = useLocalDateTimeString(pause.resumes_at);

  const now = useMinuteTick();

  const isBreaker = pause.origin === PauseOrigin.Breaker;

  const message = [
    t(AnalyticsPipelinesI18nKey.PausedBanner),
    isBreaker ? t(AnalyticsPipelinesI18nKey.PausedByBreaker) : null,
    // The evidence the breaker tripped on — how much of the recent work was dead-lettered — presented as
    // the service worded it, because the threshold and the window are its configuration and a console
    // that restated them would be quoting a copy. Not for an operator pause: the service records a fixed
    // string there saying only that an operator paused it, which the sentence above already says.
    isBreaker && pause.reason ? t(AnalyticsPipelinesI18nKey.PausedReason, { reason: pause.reason }) : null,
    isBreaker && resumesAt ? t(AnalyticsPipelinesI18nKey.PausedResumesAt, { time: resumesAt }) : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Notification
      variant={NotificationVariant.Warning}
      type={NotificationType.SectionMessage}
      role="status"
      title={
        pause.since
          ? t(AnalyticsPipelinesI18nKey.PausedBannerTitle, { age: formatRelativeTime(pause.since, now) })
          : t(AnalyticsPipelinesI18nKey.PausedBannerTitleUndated)
      }
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
