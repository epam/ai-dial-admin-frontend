'use client';

import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  AlertVariant,
  DialAlert,
  DialConfirmationPopup,
  DialNeutralButton,
  DialNoDataContent,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconPencilMinus } from '@tabler/icons-react';
import { ColDef } from 'ag-grid-community';

import TableView from '@/src/components/Common/ViewSelector/TableView';
import ViewSelector from '@/src/components/Common/ViewSelector/ViewSelector';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { PARAMETERS_SCHEMA_COLUMNS, TOOL_SCHEMA_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import {
  ButtonsI18nKey,
  ContainersI18nKey,
  EntitiesI18nKey,
  EntityFieldsI18nKey,
  TestSuitesI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { TestSuite, TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { ParamsView } from '@/src/types/parameters';
import { convertSchemaToTable } from '@/src/utils/schema';
import Methods from './Methods';

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
    return convertSchemaToTable(testSuite?.endpointRef?.requestBodySchema as unknown as DialScheme);
  }, [testSuite?.endpointRef?.requestBodySchema]);

  const outputSchema = useMemo(() => {
    return convertSchemaToTable(testSuite?.endpointRef?.responseBodySchema as unknown as DialScheme);
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

  const [currentSuite, setCurrentSuite] = useState(structuredClone(testSuite));

  const onConfirm = useCallback(() => {
    onChangeTestSuite(currentSuite);
    setIsMethodModalOpen(false);
  }, [onChangeTestSuite, currentSuite]);

  const disableConfirm = useMemo(() => {
    return !currentSuite.endpointRef?.method || !currentSuite.endpointRef?.relativePattern;
  }, [currentSuite.endpointRef?.method, currentSuite.endpointRef?.relativePattern]);

  return (testSuite?.endpointRef && !!Object.keys(testSuite?.endpointRef).length) || testSuite ? (
    <div className="flex flex-col gap-4 p-4 h-full w-full relative">
      <div className="flex flex-row justify-between">
        <div>
          {testSuite?.endpointRef?.method && (
            <span className="tiny bg-layer-3 rounded p-1 border border-primary whitespace-nowrap max-w-[200px] overflow-hidden">
              {testSuite?.endpointRef.method}
            </span>
          )}
          <span className="truncate text-primary ml-1">{testSuite?.endpointRef?.relativePattern}</span>
        </div>
        <div className="flex flex-row gap-4 items-center">
          <ViewSelector view={view} changeView={setView} />
          {selectedAppType && (
            <>
              <div className="w-[1px] h-6 bg-layer-4"></div>
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
              entity={testSuite?.endpointRef as Partial<TestSuiteEndpointRef>}
              setSelectedEntity={onChangeEndpointRef as Dispatch<SetStateAction<Partial<TestSuiteEndpointRef>>>}
              options={{ stickyScroll: { enabled: false } }}
            />
          </div>
        )}
      </div>
      {isMethodModalOpen &&
        createPortal(
          <DialConfirmationPopup
            portalId="MethodChangeModal"
            header={t(TestSuitesI18nKey.ChangeMethod)}
            open={isMethodModalOpen}
            onClose={() => setIsMethodModalOpen(false)}
            confirmLabel={t(ButtonsI18nKey.Confirm)}
            cancelLabel={t(ButtonsI18nKey.Cancel)}
            onConfirm={onConfirm}
            disableConfirmButton={disableConfirm}
            size={PopupSize.Lg}
            className="h-[800px]"
          >
            <div className="w-full h-full flex flex-col gap-4 px-6 py-4">
              <div className="flex-1 overflow-auto">
                <Methods
                  selectedApplication={{
                    $type: selectedAppType as string,
                    deploymentId: testSuite?.deploymentRef?.id as string,
                  }}
                  testSuite={currentSuite}
                  onChange={setCurrentSuite}
                />
              </div>

              <DialAlert message={t(TestSuitesI18nKey.MethodChangeWarning)} variant={AlertVariant.Warning} />
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
    </div>
  ) : (
    <DialNoDataContent title={t(EntitiesI18nKey.NoMethods)} />
  );
};

export default MethodInfo;
