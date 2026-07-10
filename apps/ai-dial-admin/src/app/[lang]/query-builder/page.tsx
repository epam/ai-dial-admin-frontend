import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { errorObjLog } from '@/src/server/logger';
import { getEntities, getEntitySchema } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let entities: AnalyticsEntity[] = [];
  let entityName = '';
  let fields: AnalyticsEntityField[] = [];

  try {
    entities = (await getEntities()) ?? [];
    const first = entities[0];
    if (first) {
      entityName = first.name;
      if (!first.complex) {
        const schema = await getEntitySchema(first.name);
        fields = schema?.fields ?? [];
      }
    }
  } catch (e) {
    errorObjLog(e, 'Failed to fetch query builder data');
  }

  return <QueryBuilder initialEntities={entities} initialEntityName={entityName} initialFields={fields} />;
}
