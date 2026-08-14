import { notFound } from 'next/navigation';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { savedQueryEntityName } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getEntities, getEntitySchema, getFunctions } from '@/src/app/[lang]/queries/actions';
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

  try {
    const [query, entitiesRes, functionsRes] = await Promise.all([
      getSavedQuery(decodeURIComponent(id)),
      getEntities(),
      getFunctions(),
    ]);
    savedQuery = query;
    entities = entitiesRes ?? [];
    functions = functionsRes ?? [];

    if (savedQuery) {
      const schema = await getEntitySchema(savedQueryEntityName(savedQuery));
      fields = schema?.fields ?? [];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch query view data');
  }

  if (savedQuery == null) {
    notFound();
  }

  return (
    <SaveValidationContextProvider>
      <QueryBuilder
        initialEntities={entities}
        initialEntityName={savedQueryEntityName(savedQuery)}
        initialFields={fields}
        initialFunctions={functions}
        name={savedQuery.name}
        savedQuery={savedQuery}
      />
    </SaveValidationContextProvider>
  );
}
