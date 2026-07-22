import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import Page403 from '@/src/components/Page403/Page403';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryFunction } from '@/src/models/analytics/query-function';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getEntities, getEntitySchema, getFunctions } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let entities: AnalyticsEntity[] = [];
  let entityName = '';
  let fields: AnalyticsEntityField[] = [];
  // The function catalog is the sole source of the builder's function set; on failure it stays
  // empty and the builder degrades to plain-column querying (no static fallback).
  let functions: QueryFunction[] = [];

  try {
    [entities, functions] = await Promise.all([
      getEntities().then((e) => e ?? []),
      getFunctions().then((f) => f ?? []),
    ]);
    const first = entities[0];
    if (first) {
      entityName = first.name;
      const schema = await getEntitySchema(first.name);
      fields = schema?.fields ?? [];
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch query builder data');
  }

  return (
    <QueryBuilder
      initialEntities={entities}
      initialEntityName={entityName}
      initialFields={fields}
      initialFunctions={functions}
    />
  );
}
