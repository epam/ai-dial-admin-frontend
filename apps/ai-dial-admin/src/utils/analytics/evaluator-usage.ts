import { EvaluatorListRow, EvaluatorSummary, EvaluatorUsage } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';

export const toEvaluatorUsage = (rules: EnrichmentRuleListItem[]): EvaluatorUsage =>
  rules.reduce<EvaluatorUsage>(
    (usage, rule) => usage.set(rule.evaluator_name, (usage.get(rule.evaluator_name) ?? 0) + 1),
    new Map(),
  );

// Null rather than zero when usage is unknown: zero would claim the evaluator is unused.
export const toEvaluatorRows = (evaluators: EvaluatorSummary[], usage: EvaluatorUsage | null): EvaluatorListRow[] =>
  evaluators.map((evaluator) => ({
    name: evaluator.name,
    latest_version: evaluator.latest_version,
    created_at: evaluator.created_at,
    usedBy: usage ? (usage.get(evaluator.name) ?? 0) : null,
  }));

export const getReferencingRules = (rules: EnrichmentRuleListItem[], evaluatorName: string): EnrichmentRuleListItem[] =>
  rules.filter((rule) => rule.evaluator_name === evaluatorName);
