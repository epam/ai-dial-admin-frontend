'use client';

import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';

import { DialSwitch, DialTabs } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn, TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getEndpointSchemaTabs } from '@/src/utils/tabs/utils';
import SchemaGrid from './SchemaGrid';
import Columns from './Columns';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const EndpointSchema: FC<Props> = ({ testSuite, onChangeTestSuite, isSkipRefresh }) => {
  const t = useI18n();
  const tabs = getEndpointSchemaTabs(t);
  const [activeSchemaTab, setActiveSchemaTab] = useState(tabs[0].id);

  const [isJsonView, setIsJsonView] = useState(false);

  const onChangeSchemaTab = useCallback((id: string) => {
    setActiveSchemaTab(id as string);
    if (id === EntityViewTab.Columns) {
      setIsJsonView(false);
    }
  }, []);

  const currentSchema =
    activeSchemaTab === EntityViewTab.RequestSchema
      ? (testSuite.endpointRef?.requestBodySchema as unknown as JSONSchema7 | undefined)
      : (testSuite.endpointRef?.responseBodySchema as unknown as JSONSchema7 | undefined);

  const onChangeSchema = useCallback(
    (schema: JSONSchema7, isSkipRefresh?: boolean) => {
      const endpointRef = { ...testSuite.endpointRef };
      if (activeSchemaTab === EntityViewTab.RequestSchema) {
        endpointRef.requestBodySchema = schema as unknown as typeof endpointRef.requestBodySchema;
      } else {
        endpointRef.responseBodySchema = schema as unknown as typeof endpointRef.responseBodySchema;
      }
      onChangeTestSuite({ ...testSuite, endpointRef }, isSkipRefresh);
    },
    [testSuite, activeSchemaTab, onChangeTestSuite],
  );

  const onChangeResponseColumns = useCallback(
    (responseColumns: ResponseColumn[]) => {
      onChangeTestSuite({ ...testSuite, responseColumns });
    },
    [testSuite, onChangeTestSuite],
  );

  return (
    <div className="flex flex-col w-full h-full gap-2">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row justify-between">
          <DialTabs tabs={tabs} activeTab={activeSchemaTab} onClick={onChangeSchemaTab} />
          {activeSchemaTab !== EntityViewTab.Columns && (
            <DialSwitch
              isOn={isJsonView}
              label="JSON"
              switchId="jsonView"
              onChange={() => setIsJsonView(!isJsonView)}
            />
          )}
        </div>
      </div>
      {activeSchemaTab !== EntityViewTab.Columns ? (
        isJsonView ? (
          <JsonEditor
            entity={currentSchema as object}
            options={{ stickyScroll: { enabled: false } }}
            setSelectedEntity={onChangeSchema as Dispatch<SetStateAction<JSONSchema7>>}
          />
        ) : (
          <SchemaGrid schema={currentSchema} onChange={onChangeSchema} isSkipRefresh={isSkipRefresh} />
        )
      ) : (
        <Columns responseColumns={testSuite.responseColumns || []} onChangeResponseColumns={onChangeResponseColumns} />
      )}
    </div>
  );
};

export default EndpointSchema;
