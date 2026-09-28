'use client';

import { FC, useMemo } from 'react';

import { DialLabelledText, DialSelectField, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { withStrandedOption } from '@/src/components/Analytics/Pipelines/Common/utils';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { getGroupByCandidates } from '@/src/utils/analytics/group-by-candidates';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  value?: string;
  grainKey?: string;
  fields: AnalyticsEntityField[];
  onChange: (groupBy: string) => void;
}

/**
 * A group trigger's grouping key: the target's grain key, spelled the way this read source reaches it.
 *
 * It is neither free text nor a fixed value. The service takes the bare key only when the source declares
 * it as a column of its own, and otherwise demands `<enrichment>.<grain key>` — so the console offers the
 * spellings it will accept and lets the author pick. Where the source reaches the key one way only, there
 * is nothing to choose: the value is stated as read-only and the label carries the reason, rather than a
 * select with a single option pretending otherwise.
 */
const GroupByField: FC<Props> = ({ value, grainKey, fields, onChange }) => {
  const t = useI18n();

  const candidates = useMemo(() => getGroupByCandidates(fields, grainKey), [fields, grainKey]);

  const selected = value || candidates[0] || '';
  const isChoice = candidates.length > 1;

  if (isChoice) {
    return (
      <DialSelectField
        id="pipeline-trigger-group-by"
        required
        containerClassName={getControlClassName()}
        label={t(AnalyticsPipelinesI18nKey.GroupBy)}
        caption={t(AnalyticsPipelinesI18nKey.GroupByCaption)}
        options={withStrandedOption(
          candidates.map((candidate) => ({ value: candidate, label: candidate })),
          selected,
        )}
        value={selected}
        onChange={(next) => onChange(next as string)}
      />
    );
  }

  const hint = t(
    candidates.length ? AnalyticsPipelinesI18nKey.GroupByOnlySpelling : AnalyticsPipelinesI18nKey.GroupByUnreachable,
  );

  return (
    <div className={getControlClassName()}>
      <DialLabelledText
        label={
          <span className="flex items-center gap-1">
            {t(AnalyticsPipelinesI18nKey.GroupBy)}
            <Tooltip tooltip={hint} asChild>
              <IconInfoCircle
                {...BASE_BUTTON_ICON_PROPS}
                role="img"
                aria-label={hint}
                tabIndex={0}
                className="shrink-0 text-secondary"
              />
            </Tooltip>
          </span>
        }
        text={selected || t(AnalyticsPipelinesI18nKey.NotSet)}
      />
    </div>
  );
};

export default GroupByField;
