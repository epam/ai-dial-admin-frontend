import { FC } from 'react';

import { ICellRendererParams } from 'ag-grid-community';

import EvaluatorTypeBadge from '@/src/components/Analytics/Evaluators/EvaluatorTypeBadge';
import { isPinnedToLatest } from '@/src/components/Analytics/EnrichmentRules/utils';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';

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
      <EvaluatorTypeBadge type={type} />
    </span>
  );
};

export const EvaluatorCellRenderer: FC<ICellRendererParams<EnrichmentRuleListItem>> = ({ data }) => (
  <EvaluatorCell rule={data} />
);

export default EvaluatorCell;
