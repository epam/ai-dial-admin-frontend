'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { DialNeutralButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
import { IconPencilMinus } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import TableView from '@/src/components/Common/ViewSelector/TableView';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import ChangeMethodModal from '@/src/components/TestSuites/Modals/ChangeMethodModal/ChangeMethodModal';
import { PARAMETERS_SCHEMA_COLUMNS, TOOL_SCHEMA_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ContainersI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { ParamsView } from '@/src/types/parameters';
import { convertSchemaToTable } from '@/src/utils/schema';
import MethodEndpoint from './Endpoint';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
  selectedAppType?: string;
}

const MethodInfo: FC<Props> = ({ testSuite, onChangeTestSuite, selectedAppType }) => {
  const t = useI18n();
  const SCHEMA_COLUMNS: ColDef[] = useMemo(() => TOOL_SCHEMA_COLUMNS(t), [t]);
  const PARAMETERS_COLUMNS: ColDef[] = useMemo(() => PARAMETERS_SCHEMA_COLUMNS(t), [t]);

  const [view, setView] = useState(ParamsView.TABLE);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);

  const inputSchema = useMemo(() => {
    return convertSchemaToTable(testSuite?.endpointRef?.requestBodySchema?.schema);
  }, [testSuite?.endpointRef?.requestBodySchema?.schema]);

  const outputSchema = useMemo(() => {
    return convertSchemaToTable(testSuite?.endpointRef?.responseBodySchema as DialScheme);
  }, [testSuite?.endpointRef?.responseBodySchema]);

  const parameters = useMemo(() => {
    return testSuite?.endpointRef?.parameters || [];
  }, [testSuite?.endpointRef?.parameters]);

  const onChangeEndpointRef = useCallback(
    (endpointRef: TestSuiteEndpointRef) => {
      onChangeTestSuite({
        ...testSuite,
        endpointRef,
      });
    },
    [onChangeTestSuite, testSuite],
  );

  const selectedApplicationForModal =
    selectedAppType && testSuite?.deploymentRef?.id
      ? { $type: selectedAppType, deploymentId: testSuite.deploymentRef.id }
      : null;

  return (testSuite?.endpointRef && !!Object.keys(testSuite?.endpointRef).length) || testSuite ? (
    <div className="size-full flex flex-col gap-4 p-4 relative">
      <div className="flex flex-row justify-between">
        <MethodEndpoint testSuite={testSuite} />

        <div className="flex flex-row gap-4 items-center">
          <ViewSelector view={view} changeView={setView} />
          {selectedAppType && (
            <>
              <div className="w-px h-6 bg-layer-4"></div>
              <DialNeutralButton
                iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />}
                className="self-end shrink-0"
                label={t(TestSuitesI18nKey.ChangeMethod)}
                onClick={() => setIsMethodModalOpen(true)}
              />
            </>
          )}
        </div>
      </div>
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
      <ChangeMethodModal
        isModal={true}
        testSuite={testSuite}
        onChangeTestSuite={onChangeTestSuite}
        selectedApplication={selectedApplicationForModal}
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
      />
    </div>
  ) : (
    <DialNoDataContent title={t(TestSuitesI18nKey.NoInformationToPreview)} />
  );
};

export default MethodInfo;
