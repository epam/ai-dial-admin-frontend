import { ReactNode } from 'react';

import { ColDef } from 'ag-grid-community';

import { EntitiesI18nKey, InterceptorsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import GridView from '../../Grid/GridWithColumnsPanel/GridWithColumnsPanel';
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

const CollapsableInterceptors = <T extends { interceptors?: string[]; 'dial:applicationTypeInterceptors'?: string[] }>({
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
        <GridView
          emptyDataTitle={t(EntitiesI18nKey.NoGlobalInterceptors)}
          columnDefs={globalColumns}
          rowData={getInterceptorsGridData(interceptors, globalInterceptors)}
        />
      </CollapsableSection>
      {((entity as DialApplication).customAppSchemaId || (entity as unknown as AssetApp).applicationTypeSchemaId) && (
        <CollapsableSection title={`${t(InterceptorsI18nKey.Runner)}: ${runnerInterceptors?.length || 0}`}>
          <GridView
            emptyDataTitle={t(EntitiesI18nKey.NoRunnerInterceptors)}
            columnDefs={runnerColumns}
            rowData={getInterceptorsGridData(interceptors, runnerInterceptors)}
          />
        </CollapsableSection>
      )}
      <CollapsableSection
        title={`${t(InterceptorsI18nKey.Local)}: ${entity.interceptors?.length || entity['dial:applicationTypeInterceptors']?.length || 0}`}
        headerButton={headerButton}
      >
        {localInterceptors}
      </CollapsableSection>
    </div>
  );
};

export default CollapsableInterceptors;
