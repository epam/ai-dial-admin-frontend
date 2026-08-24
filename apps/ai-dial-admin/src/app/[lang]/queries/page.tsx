import QueriesList from '@/src/components/Analytics/Queries/List/QueriesList';
import Page403 from '@/src/components/Page403/Page403';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { AnalyticsEntity } from '@/src/models/analytics/entity';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { getEntities } from '@/src/app/[lang]/queries/actions';
import { listSavedQueries } from './actions';

export const dynamic = 'force-dynamic';

export default async function Page() {
  if (await isAnalyticsForbidden()) {
    return <Page403 />;
  }

  let queries: SavedQuery[] = [];
  let entities: AnalyticsEntity[] = [];

  try {
    const [personal, common, entitiesRes] = await Promise.all([
      listSavedQueries(SavedQueryScope.Personal),
      listSavedQueries(SavedQueryScope.Common),
      getEntities(),
    ]);
    queries = [...(personal ?? []), ...(common ?? [])];
    entities = entitiesRes ?? [];
  } catch (e) {
    errorObjLog(e, 'Failed to fetch queries list data');
  }

  return (
    <SaveValidationContextProvider>
      <QueriesList data={queries} entities={entities} />
    </SaveValidationContextProvider>
  );
}
