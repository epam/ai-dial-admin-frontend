'use client';

import { FC } from 'react';

import { DialSelectField } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { FOLLOW_TARGET_SOURCE } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SourceMode } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { getSourceMode } from '@/src/utils/analytics/pipeline-dto';
import { withStrandedOption } from '@/src/components/Analytics/Pipelines/Common/utils';

interface Props {
  className?: string;
  input?: string;
  sourceTable?: string;
  tables: AnalyticsTable[];
  onChange: (input?: string) => void;
}

/**
 * Following versus pinning is **inferred**, not stored: the compiled read the detail page asks for
 * resolves `inputs` either way, so a pipeline that follows is indistinguishable from one pinned to the
 * same table. An input equal to the target's `source_table` therefore reads as following, and the request
 * builder omits it on the same test — one rule, both directions.
 */
const SourceField: FC<Props> = ({ className, input, sourceTable, tables, onChange }) => {
  const t = useI18n();

  const followLabel = sourceTable
    ? `${t(AnalyticsPipelinesI18nKey.SourceFollow)} · ${sourceTable}`
    : t(AnalyticsPipelinesI18nKey.SourceFollowUnresolved);

  const isFollowing = getSourceMode(input ? [input] : undefined, sourceTable) === SourceMode.Follow;

  const options = [
    { value: FOLLOW_TARGET_SOURCE, label: followLabel },
    ...tables
      .filter((table) => table.type === AnalyticsTableType.Source)
      .map((table) => ({ value: table.name, label: table.name })),
  ];

  const value = isFollowing ? FOLLOW_TARGET_SOURCE : (input ?? '');

  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      <DialSelectField
        id="pipeline-input"
        label={t(AnalyticsPipelinesI18nKey.Source)}
        options={withStrandedOption(options, value)}
        value={value}
        onChange={(next) => onChange(next === FOLLOW_TARGET_SOURCE ? undefined : (next as string))}
      />
      <span className="text-secondary dial-tiny-text">{t(AnalyticsPipelinesI18nKey.SourceFollowCaption)}</span>
    </div>
  );
};

export default SourceField;
