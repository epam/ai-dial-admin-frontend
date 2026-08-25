import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { isPinnedToLatest } from '@/src/components/Analytics/EnrichmentRules/utils';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';

const TYPE_COLOR: Record<EvaluatorType, string> = {
  [EvaluatorType.Llm]: 'text-accent-primary',
  [EvaluatorType.Sql]: 'text-success',
};

const TYPE_LABEL: Record<EvaluatorType, AnalyticsEnrichmentRulesI18nKey> = {
  [EvaluatorType.Llm]: AnalyticsEnrichmentRulesI18nKey.EvaluatorTypeLlm,
  [EvaluatorType.Sql]: AnalyticsEnrichmentRulesI18nKey.EvaluatorTypeSql,
};

interface Props {
  rule?: EnrichmentRuleListItem;
}

const EvaluatorCell: FC<Props> = ({ rule }) => {
  const t = useI18n();

  if (!rule?.evaluator) {
    return null;
  }

  const { name, version, type } = rule.evaluator;

  return (
    <span className="flex items-center gap-x-1.5">
      <span className="truncate">{`${name}@${version}`}</span>
      {isPinnedToLatest(rule.evaluator_version) && (
        <span className="shrink-0 text-secondary dial-tiny-text">{t(AnalyticsEnrichmentRulesI18nKey.Latest)}</span>
      )}
      {type && (
        <span
          className={classNames(
            'shrink-0 rounded bg-layer-4 px-2 py-0.5 font-semibold uppercase dial-tiny-text',
            TYPE_COLOR[type] ?? 'text-secondary',
          )}
        >
          {t(TYPE_LABEL[type])}
        </span>
      )}
    </span>
  );
};

export const EvaluatorCellRenderer: FC<ICellRendererParams<EnrichmentRuleListItem>> = ({ data }) => (
  <EvaluatorCell rule={data} />
);

export default EvaluatorCell;
