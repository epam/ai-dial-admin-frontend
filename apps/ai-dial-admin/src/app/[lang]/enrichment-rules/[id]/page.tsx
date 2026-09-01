import { notFound } from 'next/navigation';

import RuleDetailView from '@/src/components/Analytics/EnrichmentRules/RuleDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { EnrichmentRule } from '@/src/models/analytics/rule';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import { getRule, getRules } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { id } = await params;
  const ruleId = decodeURIComponent(id);
  let rule: EnrichmentRule | null = null;
  let evaluators: EvaluatorSummary[] | null = null;
  let takenTargets: string[] = [];

  try {
    rule = await getRule(ruleId);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch enrichment rule');
  }

  // Separate from the rule read: a failed lookup degrades a control, while a failed rule read is the page.
  try {
    evaluators = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch evaluators for the enrichment rule view');
  }

  try {
    // The UNIQUE constraint on `target_enrichment` spans all rules, so the exclusion is only knowable here.
    takenTargets = (await getRules())?.map((item) => item.target_enrichment) ?? [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch bound target enrichments');
  }

  if (rule == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <RuleDetailView
        originalRule={rule}
        evaluators={evaluators ?? []}
        hasEvaluatorsError={evaluators == null}
        takenTargets={takenTargets}
      />
    </SaveValidationContextProvider>
  );
}
