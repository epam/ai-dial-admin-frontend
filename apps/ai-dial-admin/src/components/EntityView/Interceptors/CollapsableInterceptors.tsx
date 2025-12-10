import { ReactNode } from 'react';

import { DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import Grid from '@/src/components/Grid/Grid';
import { EntitiesI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import CollapsableSection from './CollapsableSection';
import { getInterceptorsGridData } from './utils';

interface Props<T> {
  entity: T;
  interceptors: DialInterceptor[];
  globalColumns: ColDef[];
  runnerColumns: ColDef[];
  headerButton?: ReactNode;
  localInterceptors?: ReactNode;
  runnerInterceptors?: string[];
  globalInterceptors: string[] | null;
}

const CollapsableInterceptors = <T extends { interceptors?: string[] }>({
  entity,
  interceptors,
  globalColumns,
  runnerColumns,
  headerButton,
  localInterceptors,
  runnerInterceptors,
  globalInterceptors,
}: Props<T>) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col gap-5">
      <CollapsableSection title={`${t(InterceptorsI18nKey.Global)}: ${globalInterceptors?.length || 0}`}>
        {!globalInterceptors?.length ? (
          <DialNoDataContent title={t(EntitiesI18nKey.NoGlobalInterceptors)} />
        ) : (
          <Grid columnDefs={globalColumns} rowData={getInterceptorsGridData(interceptors, globalInterceptors)} />
        )}
      </CollapsableSection>
      {((entity as DialApplication).customAppSchemaId || (entity as unknown as AssetApp).applicationTypeSchemaId) && (
        <CollapsableSection title={`${t(InterceptorsI18nKey.Runner)}: ${runnerInterceptors?.length || 0}`}>
          {!runnerInterceptors?.length ? (
            <DialNoDataContent title={t(EntitiesI18nKey.NoRunnerInterceptors)} />
          ) : (
            <Grid columnDefs={runnerColumns} rowData={getInterceptorsGridData(interceptors, runnerInterceptors)} />
          )}
        </CollapsableSection>
      )}
      <CollapsableSection
        title={`${t(InterceptorsI18nKey.Local)}: ${entity.interceptors?.length || 0}`}
        headerButton={headerButton}
      >
        {localInterceptors}
      </CollapsableSection>
    </div>
  );
};

export default CollapsableInterceptors;
