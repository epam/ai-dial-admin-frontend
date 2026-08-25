import EnrichmentRulesView from '@/src/components/Analytics/EnrichmentRules/EnrichmentRulesView';
import Page403 from '@/src/components/Page403/Page403';
import { EnrichmentRuleListItem } from '@/src/models/analytics/rule';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getRules } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let rules: EnrichmentRuleListItem[] | null = null;

  try {
    rules = await getRules();
  } catch (e) {
    errorObjLog(e, 'Failed to fetch enrichment rules view data');
  }

  // A failed listing renders the console with a stated load failure rather than a bare 404: an
  // operator cannot tell "no rules registered" from "the service is unreachable" from a not-found
  // page, and telling those apart is what this page exists for.
  return <EnrichmentRulesView initialRules={rules ?? []} hasLoadError={rules == null} />;
}
