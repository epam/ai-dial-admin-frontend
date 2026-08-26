import { notFound } from 'next/navigation';

import { getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import Page403 from '@/src/components/Page403/Page403';
import { Evaluator, EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getReferencingRules } from '@/src/utils/analytics/evaluator-usage';
import { getEvaluator, getEvaluators, getEvaluatorVersion } from '../actions';

export const dynamic = 'force-dynamic';

const toVersion = (raw?: string): number | undefined => {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ version?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  // Next already percent-decodes a dynamic param; decoding again throws on a name containing '%'.
  const name = (await params).name;
  const version = toVersion((await searchParams).version);

  let evaluator: Evaluator | null = null;
  let evaluators: EvaluatorSummary[] | null = null;
  let referencingRules: EnrichmentRuleListItem[] | null = null;

  try {
    evaluator = version ? await getEvaluatorVersion(name, version) : await getEvaluator(name);
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version');
  }

  try {
    evaluators = await getEvaluators();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the evaluator version list');
  }

  try {
    const rules = await getRules();
    referencingRules = rules ? getReferencingRules(rules, name) : null;
  } catch (e) {
    errorObjLog(e, 'Failed to fetch the rules referencing the evaluator');
  }

  if (evaluator == null) {
    notFound();
  }

  return (
    <EvaluatorDetailView
      evaluator={evaluator}
      summary={evaluators?.find((item) => item.name === name) ?? null}
      hasSummaryError={evaluators == null}
      referencingRules={referencingRules}
    />
  );
}
