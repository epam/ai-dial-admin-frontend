import { ReactNode } from 'react';

import { getEntities, listSavedQueries } from '@/src/app/[lang]/queries/actions';
import { getTables } from '@/src/app/[lang]/tables/actions';
import { SourcePanelProvider } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourceTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { toSourceTables } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { ReadFailure } from '@/src/models/server-action';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { errorObjLog } from '@/src/server/logger';
import { toReadFailure } from '@/src/utils/notification';

export const dynamic = 'force-dynamic';

const settled = <T,>(result: PromiseSettledResult<T>, context: string): T | null => {
  if (result.status === 'fulfilled') return result.value;
  errorObjLog(result.reason, context);
  return null;
};

export default async function Layout({ children }: { children: ReactNode }) {
  let tables: SourceTable[] = [];
  let queries: SavedQuery[] = [];
  let tablesFailure: ReadFailure | null = null;
  let queriesFailure: ReadFailure | null = null;

  if (!(await isAnalyticsForbidden())) {
    const [entitiesRes, tablesRes, personalRes, commonRes] = await Promise.allSettled([
      getEntities(),
      getTables(),
      listSavedQueries(SavedQueryScope.Personal),
      listSavedQueries(SavedQueryScope.Common),
    ]);

    const entities = settled(entitiesRes, 'Failed to fetch source panel entities');
    const personal = settled(personalRes, 'Failed to fetch personal saved queries');
    const common = settled(commonRes, 'Failed to fetch common saved queries');

    tables = toSourceTables(
      entities?.response ?? [],
      settled(tablesRes, 'Failed to fetch source panel tables')?.response ?? [],
    );
    queries = [...(personal ?? []), ...(common ?? [])];
    tablesFailure = entities?.success ? null : toReadFailure(entities ?? void 0);
    queriesFailure = personal && common ? null : {};
  }

  return (
    <SourcePanelProvider
      tables={tables}
      queries={queries}
      tablesFailure={tablesFailure}
      queriesFailure={queriesFailure}
    >
      {children}
    </SourcePanelProvider>
  );
}
