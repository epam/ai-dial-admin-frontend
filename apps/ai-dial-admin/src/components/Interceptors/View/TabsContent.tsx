'use client';

import { FC, useCallback } from 'react';

import { cloneDeep } from 'lodash';

import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantAppRunnersForInterceptor } from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { RUNNERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import EntitiesTabContent from './EntitiesTabContent';
import ParameterSchema from './ParameterSchema/ParameterSchema';
import PropertiesTabContent from './Properties/TabContent';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { DialModel } from '@/src/models/dial/model';

interface Props {
  names: string[];
  activeTab: EntityViewTab;
  selectedFormat: ExportFormat;
  selectedInterceptor: DialInterceptor;
  originalInterceptor: DialInterceptor;
  models: DialModel[];
  applications: DialApplication[];
  interceptorTemplate?: InterceptorTemplate | null;
  appRunners: DialApplicationScheme[];
  onChange: (interceptor: DialInterceptor) => void;
}

const TabsContent: FC<Props> = ({
  selectedInterceptor,
  originalInterceptor,
  selectedFormat,
  onChange,
  activeTab,
  names,
  interceptorTemplate,
  appRunners,
  ...props
}) => {
  const t = useI18n();

  const onChangeConfiguration = useCallback(
    (data: Record<string, unknown>) => {
      const newInterceptor = {
        ...selectedInterceptor,
        defaults: {
          ...selectedInterceptor.defaults,
          custom_fields: {
            interceptor_configuration: data,
          },
        },
      };
      onChange(newInterceptor);
    },
    [onChange, selectedInterceptor],
  );

  const onRemoveRunner = useCallback(
    (row: EntitiesGridData) => {
      const newInterceptor = cloneDeep(selectedInterceptor);
      newInterceptor.applicationTypeSchemas = newInterceptor.applicationTypeSchemas?.filter(
        (runner) => runner !== row.$id,
      );
      onChange(newInterceptor);
    },
    [onChange, selectedInterceptor],
  );

  const onAddRunner = useCallback(
    (rows: EntitiesGridData[]) => {
      const newRunners = rows.map((row) => row.$id as string);
      onChange({
        ...selectedInterceptor,
        applicationTypeSchemas: [...(selectedInterceptor.applicationTypeSchemas || []), ...newRunners],
      });
    },
    [onChange, selectedInterceptor],
  );

  return (
    selectedFormat === ExportFormat.ADMIN && (
      <>
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent selectedInterceptor={selectedInterceptor} onChange={onChange} names={names} />
        )}
        {activeTab === EntityViewTab.ParameterSchema && (
          <ParameterSchema
            configuration={
              selectedInterceptor.defaults?.custom_fields?.['interceptor_configuration' as keyof DefaultsValue]
            }
            onChangeConfiguration={onChangeConfiguration}
            schemaURL={
              selectedInterceptor.features?.configurationEndpoint || interceptorTemplate?.configurationEndpoint
            }
            name={selectedInterceptor.name as string}
          />
        )}
        {activeTab === EntityViewTab.ApplicationRunners && (
          <AddEntitiesView
            viewTitle={t(TabsI18nKey.ApplicationRunners)}
            customColumns={RUNNERS_COLUMNS}
            modalTitle={t(EntitiesI18nKey.AddApplicationRunner)}
            emptyDataTitle={t(EntitiesI18nKey.NoApplicationRunners)}
            appRunners={appRunners}
            onAdd={onAddRunner}
            onRemove={onRemoveRunner}
            getRelevantDataForEntity={getRelevantAppRunnersForInterceptor.bind(this, selectedInterceptor)}
          />
        )}
        {activeTab === EntityViewTab.Entities && (
          <EntitiesTabContent
            selectedInterceptor={selectedInterceptor}
            originalInterceptor={originalInterceptor}
            onChange={onChange}
            {...props}
          />
        )}
        {activeTab === EntityViewTab.Audit && (
          <EntityAudit entity={selectedInterceptor} view={ApplicationRoute.Interceptors} />
        )}
      </>
    )
  );
};

export default TabsContent;
