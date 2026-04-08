'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { DialInput, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import TableView from '@/src/components/Common/ViewSelector/TableView';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { PARAMETERS_SCHEMA_COLUMNS, TOOL_SCHEMA_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ContainersI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { ParamsView } from '@/src/types/parameters';
import { convertSchemaToTable } from '@/src/utils/schema';
import { isContainRegexSymbols } from '@/src/utils/validation/path-error';
import MethodEndpoint from './Endpoint';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const MethodInfo: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const SCHEMA_COLUMNS: ColDef[] = useMemo(() => TOOL_SCHEMA_COLUMNS(t), [t]);
  const PARAMETERS_COLUMNS: ColDef[] = useMemo(() => PARAMETERS_SCHEMA_COLUMNS(t), [t]);

  const [view, setView] = useState(ParamsView.TABLE);
  const [finalPathError, setFinalPathError] = useState<string | undefined>(undefined);

  const inputSchema = useMemo(() => {
    return convertSchemaToTable(testSuite?.endpointRef?.requestBodySchema?.schema);
  }, [testSuite?.endpointRef?.requestBodySchema?.schema]);

  const outputSchema = useMemo(() => {
    return convertSchemaToTable(testSuite?.endpointRef?.responseBodySchema as DialScheme);
  }, [testSuite?.endpointRef?.responseBodySchema]);

  const parameters = useMemo(() => {
    return testSuite?.endpointRef?.parameters || [];
  }, [testSuite?.endpointRef?.parameters]);

  const validateFinalPath = useCallback(
    (urlTemplate?: string) => {
      const relativeUrlPattern = testSuite.endpointRef?.relativeUrlPattern;

      if (!urlTemplate || !relativeUrlPattern) {
        return undefined;
      }

      if (isContainRegexSymbols(relativeUrlPattern)) {
        try {
          const regex = new RegExp(relativeUrlPattern);

          if (!regex.test(urlTemplate)) {
            dispatch({ type: ValidationActionType.SetField, field: 'urlTemplate', isValid: false });
            return `Not matches with ${relativeUrlPattern} regex`;
          }
        } catch (error) {
          console.error('Invalid regex pattern:', error);
        }
      }
      dispatch({ type: ValidationActionType.SetField, field: 'urlTemplate', isValid: true });
      return undefined;
    },
    [dispatch, testSuite.endpointRef?.relativeUrlPattern],
  );

  const onChangeEndpointRef = useCallback(
    (endpointRef: TestSuiteEndpointRef) => {
      onChangeTestSuite({
        ...testSuite,
        endpointRef,
      });
    },
    [onChangeTestSuite, testSuite],
  );

  const onChangeFinalPath = useCallback(
    (finalPath?: string) => {
      onChangeTestSuite({
        ...testSuite,
        requestTemplate: { ...testSuite.requestTemplate, urlTemplate: finalPath },
      });
      setFinalPathError(validateFinalPath(finalPath));
    },
    [onChangeTestSuite, testSuite, validateFinalPath],
  );

  return (testSuite?.endpointRef && !!Object.keys(testSuite?.endpointRef).length) || testSuite ? (
    <div className="size-full flex flex-col gap-4 p-4 relative">
      <div className="flex flex-row justify-between">
        <MethodEndpoint testSuite={testSuite} />

        <div className="flex flex-row gap-4 items-center">
          <ViewSelector view={view} changeView={setView} />
        </div>
      </div>
      {testSuite?.endpointRef?.method && (
        <DialInput
          id="urlTemplate"
          value={testSuite.requestTemplate?.urlTemplate || ''}
          onChange={onChangeFinalPath}
          labelProps={{ label: t(TestSuitesI18nKey.FinalPath) }}
          containerClassName={STANDARD_CONTROL_WIDTH}
          invalid={!!finalPathError}
          error={finalPathError}
        />
      )}
      <div className="flex flex-col gap-4 relative min-h-0 overflow-auto flex-1">
        {view === ParamsView.TABLE ? (
          <>
            {parameters.length ? (
              <TableView
                title={t(EntityFieldsI18nKey.parameters)}
                columnDefs={PARAMETERS_COLUMNS}
                rowData={parameters}
              />
            ) : (
              <div className="size-full flex items-center justify-center">
                <DialNoDataContent title={t(TestSuitesI18nKey.NoInformationToPreview)} />
              </div>
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
              entity={testSuite?.endpointRef as Partial<TestSuiteEndpointRef>}
              setSelectedEntity={onChangeEndpointRef as Dispatch<SetStateAction<Partial<TestSuiteEndpointRef>>>}
              options={{ stickyScroll: { enabled: false } }}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <DialNoDataContent title={t(TestSuitesI18nKey.NoInformationToPreview)} />
  );
};

export default MethodInfo;
