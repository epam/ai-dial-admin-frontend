import { notFound } from 'next/navigation';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import { isChipRepresentable } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import {
  savedQueryPrimarySource,
  withStoredTimeBound,
} from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { KNOWN_TIME_PERIODS } from '@/src/constants/analytics/queries';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { QuerySourceProblem } from '@/src/models/analytics/query-builder';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ReadFailure } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { toReadFailure } from '@/src/utils/notification';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { getEntities, getEntitySchema, getFunctions, translateQuery } from '@/src/app/[lang]/queries/actions';
import { getSavedQuery } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { params: Promise<{ id: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { id } = await params.params;

  let savedQuery: SavedQuery | null = null;
  let entities: AnalyticsEntity[] = [];
  let functions: QueryFunction[] = [];
  let fields: AnalyticsEntityField[] = [];
  let translatedSql: string | null = null;
  let translationFailure: ReadFailure | null = null;
  let sourceProblem: QuerySourceProblem | null = null;

  try {
    const [query, entitiesRes, functionsRes] = await Promise.all([
      getSavedQuery(decodeURIComponent(id)),
      getEntities(),
      getFunctions(),
    ]);
    savedQuery = query;
    entities = entitiesRes.response ?? [];
    functions = functionsRes ?? [];

    const primarySource = savedQuery ? savedQueryPrimarySource(savedQuery) : '';
    const isSourceUnavailable = !!primarySource && !entities.some((entity) => entity.name === primarySource);
    if (isSourceUnavailable) sourceProblem = QuerySourceProblem.Unavailable;
    if (primarySource && !isSourceUnavailable) {
      const schemaRead = await getEntitySchema(primarySource);
      fields = schemaRead.response?.fields ?? [];
      if (!schemaRead.response) sourceProblem = QuerySourceProblem.SchemaFailed;
    }

    if (savedQuery?.query && !savedQuery.sql && !isChipRepresentable(savedQuery.query, functions, fields)) {
      const bounded = withStoredTimeBound({
        saved: savedQuery,
        fields,
        functions,
        knownPeriods: KNOWN_TIME_PERIODS,
        periodRange: getTimeRangeById,
      });
      try {
        const translation = await translateQuery(bounded ?? savedQuery.query);
        translatedSql = translation.success ? (translation.response?.sql ?? null) : null;
        translationFailure = translatedSql ? null : toReadFailure(translation);
      } catch (e) {
        errorObjLog(e, 'Failed to translate the saved query');
        translationFailure = {};
      }
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch query view data');
  }

  if (savedQuery == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <QueryPageShell currentQueryId={savedQuery.id}>
        <QueryBuilder
          key={savedQuery.id}
          initialEntities={entities}
          initialEntityName={savedQueryPrimarySource(savedQuery)}
          initialFields={fields}
          initialFunctions={functions}
          name={savedQuery.name}
          savedQuery={savedQuery}
          translatedSql={translatedSql}
          translationFailure={sourceProblem ? null : translationFailure}
          sourceProblem={sourceProblem}
        />
      </QueryPageShell>
    </SaveValidationContextProvider>
  );
}
