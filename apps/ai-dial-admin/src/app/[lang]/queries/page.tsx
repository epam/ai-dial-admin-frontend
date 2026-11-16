import QueryBuilderDraft from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraft';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import { resolveDraftTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getEntities, getEntitySchema, getFunctions } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page(params: { searchParams: Promise<{ table?: string }> }) {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  const { table } = await params.searchParams;

  let entities: AnalyticsEntity[] = [];
  let functions: QueryFunction[] = [];
  let fields: AnalyticsEntityField[] = [];
  let tableName = '';

  try {
    const [entitiesRes, functionsRes] = await Promise.all([getEntities(), getFunctions()]);
    entities = entitiesRes.response ?? [];
    functions = functionsRes ?? [];

    tableName = resolveDraftTable(entities, table);
    if (tableName) {
      const schemaRead = await getEntitySchema(tableName);
      fields = schemaRead.response?.fields ?? [];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch draft query data');
  }

  return (
    <SaveValidationContextProvider>
      <QueryPageShell currentTable={tableName}>
        <QueryBuilderDraft
          key={`draft:${tableName}`}
          initialEntities={entities}
          initialEntityName={tableName}
          initialFields={fields}
          initialFunctions={functions}
          name={tableName || undefined}
        />
      </QueryPageShell>
    </SaveValidationContextProvider>
  );
}
