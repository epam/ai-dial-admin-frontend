'use client';

import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsEnrichmentRulesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { EnrichmentRule } from '@/src/models/analytics/rule';

interface Props {
  rule: EnrichmentRule;
}

const RuleReadOnlyFacts: FC<Props> = ({ rule }) => {
  const t = useI18n();

  const createdAt = useLocalDateTimeString(rule.created_at);
  const updatedAt = useLocalDateTimeString(rule.updated_at);

  const notSet = t(AnalyticsEnrichmentRulesI18nKey.NotSet);
  const evaluator = `${rule.evaluator.name}@${rule.evaluator.version}`;

  return (
    <section
      aria-label={t(AnalyticsEnrichmentRulesI18nKey.ReadOnlyFacts)}
      className="flex flex-row flex-wrap gap-8 pb-8 border-b border-primary"
    >
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={rule.id} copyable copyLabel={t(EntityFieldsI18nKey.id)} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.GrainKey)} text={rule.grain_key || notSet} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.VersionColumn)} text={rule.version_column || notSet} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.EvaluatorResolved)} text={evaluator} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.EvaluatorType)} text={rule.evaluator.type} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.Generation)} text={String(rule.generation)} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.CreatedAt)} text={createdAt || notSet} />
      <LabelledText label={t(AnalyticsEnrichmentRulesI18nKey.Updated)} text={updatedAt || notSet} />
    </section>
  );
};

export default RuleReadOnlyFacts;
