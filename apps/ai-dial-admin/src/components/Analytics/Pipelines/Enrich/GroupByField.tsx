'use client';

import { FC, ReactNode, useMemo } from 'react';

import { DialInput, DialSelectField, Tooltip } from '@epam/ai-dial-ui-kit';
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
 * spellings it will accept and lets the author pick. Where the source reaches the key one way only, the
 * field is disabled rather than a select holding a single option, which would claim a choice that is not
 * there.
 *
 * Where the value comes from is on the label's info icon and nowhere else: the options state the
 * spellings themselves, and whose key it is the facts row above already says.
 */
const GroupByField: FC<Props> = ({ value, grainKey, fields, onChange }) => {
  const t = useI18n();

  const candidates = useMemo(() => getGroupByCandidates(fields, grainKey), [fields, grainKey]);

  const selected = value || candidates[0] || '';
  const isChoice = candidates.length > 1;

  const hintKey = () => {
    if (isChoice) return AnalyticsPipelinesI18nKey.GroupByChoice;

    return candidates.length
      ? AnalyticsPipelinesI18nKey.GroupByOnlySpelling
      : AnalyticsPipelinesI18nKey.GroupByUnreachable;
  };

  const hint = t(hintKey());

  const label: ReactNode = (
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
  );

  if (isChoice) {
    return (
      <DialSelectField
        id="pipeline-trigger-group-by"
        required
        containerClassName={getControlClassName()}
        label={label}
        options={withStrandedOption(
          candidates.map((candidate) => ({ value: candidate, label: candidate })),
          selected,
        )}
        value={selected}
        onChange={(next) => onChange(next as string)}
      />
    );
  }

  return (
    <DialInput
      id="pipeline-trigger-group-by"
      disabled
      containerClassName={getControlClassName()}
      labelProps={{ label }}
      value={selected}
      title={selected}
    />
  );
};

export default GroupByField;
