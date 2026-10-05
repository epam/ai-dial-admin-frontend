'use client';

import { FC, useMemo } from 'react';

import { IconBolt, IconHandStop } from '@tabler/icons-react';

import ReadinessSummaryLine from '@/src/components/Analytics/Pipelines/Groups/ReadinessSummaryLine';
import { readinessSummary } from '@/src/components/Analytics/Pipelines/Groups/groups';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ReadyWhen } from '@/src/models/analytics/pipeline';

interface Props {
  readyWhen?: ReadyWhen;
}

/**
 * The pipeline's readiness rule, generated from its saved declaration — one condition or all of them, with or
 * without a limit, through the same two lists.
 */
const ReadinessSummary: FC<Props> = ({ readyWhen }) => {
  const t = useI18n();
  const { triggers, limits } = useMemo(() => readinessSummary(readyWhen), [readyWhen]);

  return (
    <section
      aria-label={t(AnalyticsPipelinesI18nKey.GroupsSummaryLabel)}
      className="flex flex-col gap-4 rounded border border-secondary bg-layer-2 p-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="dial-small-semi-text uppercase tracking-wide text-secondary">
            {t(AnalyticsPipelinesI18nKey.GroupsTriggersTitle)}
          </h3>
          <p className="dial-tiny-text text-secondary">{t(AnalyticsPipelinesI18nKey.GroupsTriggersDescription)}</p>
        </div>
        <ul className="flex flex-row flex-wrap gap-2 dial-small-text text-primary">
          {triggers.map((item) => (
            <li
              key={item.condition}
              className="flex items-center gap-2 rounded-full border border-secondary bg-layer-3 px-3 py-1.5"
            >
              <IconBolt {...BASE_BUTTON_ICON_PROPS} className="shrink-0 text-accent-primary" aria-hidden />
              <ReadinessSummaryLine item={item} />
            </li>
          ))}
        </ul>
      </div>

      {limits.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-secondary pt-4">
          <h3 className="dial-small-semi-text uppercase tracking-wide text-secondary">
            {t(AnalyticsPipelinesI18nKey.GroupsLimitsTitle)}
          </h3>
          <ul className="flex flex-row flex-wrap gap-2 dial-small-text text-primary">
            {limits.map((item) => (
              <li
                key={item.condition}
                className="flex items-center gap-2 rounded-full border border-warning bg-warning px-3 py-1.5"
              >
                <IconHandStop {...BASE_BUTTON_ICON_PROPS} className="shrink-0 text-warning" aria-hidden />
                <ReadinessSummaryLine item={item} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default ReadinessSummary;
