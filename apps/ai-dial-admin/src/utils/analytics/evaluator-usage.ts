import { isPinnedToLatest } from '@/src/components/Analytics/EnrichmentRules/utils';
import {
  EvaluatorListRow,
  EvaluatorReferencingRule,
  EvaluatorSummary,
  EvaluatorUsage,
} from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';

// Keyed on the rule's declared `evaluator_name`, not the resolved `evaluator.name`: the two hold the same
// value, so swapping them breaks nothing visibly, but the declared one is the reference an operator wrote.
export const toEvaluatorUsage = (rules: EnrichmentRuleListItem[]): EvaluatorUsage =>
  rules.reduce<EvaluatorUsage>(
    (usage, rule) => usage.set(rule.evaluator_name, (usage.get(rule.evaluator_name) ?? 0) + 1),
    new Map(),
  );

// A null usage stays null per row rather than collapsing to zero: zero says an evaluator is dead weight,
// which is the one thing the console must not claim when it could not find out.
export const toEvaluatorRows = (evaluators: EvaluatorSummary[], usage: EvaluatorUsage | null): EvaluatorListRow[] =>
  evaluators.map((evaluator) => ({
    name: evaluator.name,
    latest_version: evaluator.latest_version,
    created_at: evaluator.created_at,
    usedBy: usage ? (usage.get(evaluator.name) ?? 0) : null,
  }));

export const getReferencingRules = (
  rules: EnrichmentRuleListItem[],
  evaluatorName: string,
): EvaluatorReferencingRule[] =>
  rules
    .filter((rule) => rule.evaluator_name === evaluatorName)
    .map((rule) => ({
      id: rule.id,
      name: rule.name,
      version: rule.evaluator.version,
      isTrackingLatest: isPinnedToLatest(rule.evaluator_version),
    }));
