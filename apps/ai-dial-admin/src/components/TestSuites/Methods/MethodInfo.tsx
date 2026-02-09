'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import TableView from '@/src/components/Common/ViewSelector/TableView';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { PARAMETERS_SCHEMA_COLUMNS, TOOL_SCHEMA_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ContainersI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { ParamsView } from '@/src/types/parameters';
import { convertSchemaToTable } from '@/src/utils/schema';

interface Props {
  endpoint: Partial<TestSuiteEndpointRef>;
  onChange: Dispatch<SetStateAction<TestSuite>>;
}

const MethodInfo: FC<Props> = ({ endpoint, onChange }) => {
  const t = useI18n();
  const SCHEMA_COLUMNS: ColDef[] = useMemo(() => TOOL_SCHEMA_COLUMNS(t), [t]);
  const PARAMETERS_COLUMNS: ColDef[] = useMemo(() => PARAMETERS_SCHEMA_COLUMNS(t), [t]);

  const [view, setView] = useState(ParamsView.TABLE);

  const inputSchema = useMemo(() => {
    return convertSchemaToTable(endpoint.requestBodySchema as unknown as DialScheme);
  }, [endpoint.requestBodySchema]);

  const outputSchema = useMemo(() => {
    return convertSchemaToTable(endpoint.responseBodySchema as unknown as DialScheme);
  }, [endpoint.responseBodySchema]);

  const parameters = useMemo(() => {
    return endpoint.parameters || [];
  }, [endpoint.parameters]);

  const onChangeEndpoint = useCallback(
    (endpointRef: TestSuiteEndpointRef) => {
      onChange((prev: TestSuite) => ({
        ...prev,
        endpointRef,
      }));
    },
    [onChange],
  );

  return endpoint && !!Object.keys(endpoint).length ? (
    <div className="flex flex-col gap-4 p-4 h-full relative">
      <div className="flex flex-row justify-between">
        <div>
          <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
            {endpoint.method}
          </span>
          <span className="truncate text-primary ml-1">{endpoint.relativeUrl}</span>
        </div>
        <ViewSelector view={view} changeView={setView} />
      </div>
      <div className="flex flex-col gap-4 relative min-h-0 overflow-auto">
        {view === ParamsView.TABLE ? (
          <>
            {!!parameters.length && (
              <TableView
                title={t(EntityFieldsI18nKey.parameters)}
                columnDefs={PARAMETERS_COLUMNS}
                rowData={parameters}
              />
            )}

            {!!inputSchema.length && (
              <TableView title={t(ContainersI18nKey.InputSchema)} columnDefs={SCHEMA_COLUMNS} rowData={inputSchema} />
            )}

            {!!outputSchema.length && (
              <TableView title={t(ContainersI18nKey.OutputSchema)} columnDefs={SCHEMA_COLUMNS} rowData={outputSchema} />
            )}
          </>
        ) : (
          <div className="flex h-[400px]">
            <JsonEditor
              entity={endpoint}
              setSelectedEntity={onChangeEndpoint as Dispatch<SetStateAction<Partial<TestSuiteEndpointRef>>>}
              options={{ stickyScroll: { enabled: false } }}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <DialNoDataContent title={t(EntitiesI18nKey.NoMethods)} />
  );
};

export default MethodInfo;
