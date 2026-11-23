import { notFound } from 'next/navigation';

import SessionDetailError from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailError';
import SessionDetailView from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailView';
import SessionsSourceError from '@/src/components/Analytics/SessionsTrace/SessionsSourceError';
import Page403 from '@/src/components/Page403/Page403';
import {
  ColumnProvenance,
  EnrichmentDefinition,
  SessionDetailRow,
  SessionEnrichmentPanel,
  SessionFeedbackPage,
  SpanFieldGroup,
  HopBodyGrants,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { SessionsSourceResolution } from '@/src/models/analytics/sessions-source';
import { ServerActionResponse } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { enrichmentProvenance, sessionFields } from '@/src/utils/analytics/session-column-catalog';
import { enrichmentPanelsOf } from '@/src/utils/analytics/session-insights';
import {
  getEnrichmentDefinitions,
  getHopBodyGrants,
  getSessionDetail,
  getSessionFeedback,
  getSessionsSchema,
  getSessionsSource,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { id } = await params;
  const chatId = decodeURIComponent(id);
  const nowMs = Date.now();

  let resolution: SessionsSourceResolution = { source: null, failure: null };
  let session: SessionDetailRow | null = null;
  let feedback: SessionFeedbackPage | null = null;
  let bodyGrants: HopBodyGrants = { isRequestReadable: false, isResponseReadable: false };
  let hasLoadError = false;
  let enrichmentPanels: SessionEnrichmentPanel[] = [];
  let panelProvenance: Record<string, ColumnProvenance> = {};
  let metadataGroups: SpanFieldGroup[] = [];

  try {
    resolution = await getSessionsSource();
  } catch (e) {
    errorObjLog(e, 'Failed to resolve the sessions source');
  }

  const source = resolution.source;

  if (!source) {
    return resolution.failure || resolution.problem ? (
      <SessionsSourceError failure={resolution.failure} problem={resolution.problem} />
    ) : (
      <SessionDetailError chatId={chatId} />
    );
  }

  try {
    const [schema, definitions, detail, availability] = await Promise.all([
      // A rejected schema read must cost the optional panels, not the page: the detail query is built from the
      // schema on the server and resolves the required fields without it.
      getSessionsSchema().catch((e): ServerActionResponse<AnalyticsEntitySchema> => {
        errorObjLog(e, 'Failed to fetch the sessions entity schema');
        return { success: false };
      }),
      getEnrichmentDefinitions(source.enrichments.filter((namespace) => namespace !== source.ratingEnrichment)).catch(
        (e): Record<string, EnrichmentDefinition> => {
          errorObjLog(e, 'Failed to read the enrichment definitions');
          return {};
        },
      ),
      getSessionDetail(chatId),
      getHopBodyGrants().catch((e) => {
        errorObjLog(e, 'Failed to probe the hop body columns');
        return { success: false, response: { isRequestReadable: false, isResponseReadable: false } };
      }),
    ]);
    const schemaFields = schema.response?.fields;

    if (!schema.success) {
      errorObjLog(schema, 'Failed to fetch the sessions entity schema');
    }

    enrichmentPanels = enrichmentPanelsOf(schemaFields, definitions, source.title);
    panelProvenance = Object.fromEntries(
      enrichmentPanels.map(({ namespace }) => [namespace, enrichmentProvenance(namespace, schemaFields)]),
    );
    metadataGroups = sessionFields(schemaFields).groups;

    hasLoadError = !detail.success;
    session = detail.response?.session ?? null;
    bodyGrants = availability.response ?? bodyGrants;

    if (!detail.success) {
      errorObjLog(detail, 'Failed to fetch session detail data');
    }

    if (session) {
      const ratings = await getSessionFeedback(
        { id: session.client_session_id, source: session.client_session_source },
        session.first_request_time,
        session.last_request_time,
      ).catch((e): ServerActionResponse<SessionFeedbackPage> => {
        errorObjLog(e, 'Failed to fetch session feedback');
        return { success: false };
      });

      feedback = ratings.response ?? null;

      if (!ratings.success) {
        errorObjLog(ratings, 'Failed to fetch session feedback');
      }
    }
  } catch (e) {
    hasLoadError = true;
    errorObjLog(e, 'Failed to fetch session detail data');
  }

  if (hasLoadError) {
    return <SessionDetailError chatId={chatId} />;
  }

  if (session == null) {
    notFound();
  }

  return (
    <SessionDetailView
      session={session}
      source={source}
      enrichmentPanels={enrichmentPanels}
      enrichmentProvenance={panelProvenance}
      metadataGroups={metadataGroups}
      feedback={feedback}
      bodyGrants={bodyGrants}
      nowMs={nowMs}
    />
  );
}
