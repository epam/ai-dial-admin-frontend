import { EnrichmentRule, EnrichmentRuleListItem } from '@/src/models/analytics/rule';

export const toRuleListItem = (rule: EnrichmentRule): EnrichmentRuleListItem => ({
  id: rule.id,
  name: rule.name,
  evaluator_name: rule.evaluator_name,
  evaluator_version: rule.evaluator_version,
  evaluator: {
    name: rule.evaluator.name,
    version: rule.evaluator.version,
    type: rule.evaluator.type,
  },
  target_enrichment: rule.target_enrichment,
  source: rule.source,
  grain_key: rule.grain_key,
  version_column: rule.version_column,
  trigger_kind: rule.trigger_kind,
  trigger_cron: rule.trigger_cron,
  group_by: rule.group_by,
  enabled: rule.enabled,
  generation: rule.generation,
  updated_at: rule.updated_at,
});
