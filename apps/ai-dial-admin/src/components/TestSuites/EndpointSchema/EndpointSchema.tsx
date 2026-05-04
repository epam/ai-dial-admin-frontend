'use client';

import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';

import { DialSelect, DialTabs, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import SchemaGrid from '@/src/components/Common/SchemaGrid/SchemaGrid';
import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { CompareI18nKey, EntitiesI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { ResponseColumn, TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getEndpointSchemaTabs } from '@/src/utils/tabs/utils';
import Columns from './Columns/Columns';

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

  const viewOptions: SelectOption[] = [
    { value: 'table', label: t(EntitiesI18nKey.Table) },
    { value: 'json', label: 'JSON' },
  ];

  const onChangeSchemaTab = useCallback((id: string) => {
    setActiveSchemaTab(id as string);
    if (id === EntityViewTab.Columns) {
      setIsJsonView(false);
    }
  }, []);

  const onViewSelectChange = useCallback((value: string | string[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setIsJsonView(v === 'json');
  }, []);

  const currentSchema =
    activeSchemaTab === EntityViewTab.RequestSchema
      ? (testSuite.endpointRef?.requestBodySchema?.schema as unknown as JSONSchema7 | undefined) || {}
      : (testSuite.endpointRef?.responseBodySchema as unknown as JSONSchema7 | undefined) || {};

  const onChangeSchema = useCallback(
    (schema: JSONSchema7, isSkipRefresh?: boolean) => {
      const endpointRef = { ...testSuite.endpointRef };
      if (activeSchemaTab === EntityViewTab.RequestSchema) {
        endpointRef.requestBodySchema = {
          ...endpointRef.requestBodySchema,
          contentType: endpointRef.requestBodySchema?.contentType || APPLICATION_JSON_TYPE,
          schema: schema as unknown as DialScheme,
        };
      } else {
        endpointRef.responseBodySchema = schema as typeof endpointRef.responseBodySchema;
      }
      onChangeTestSuite({ ...testSuite, endpointRef }, isSkipRefresh);
    },
    [testSuite, activeSchemaTab, onChangeTestSuite],
  );

  const onChangeResponseColumns = useCallback(
    (responseColumns: ResponseColumn[], isSkipRefresh?: boolean) => {
      onChangeTestSuite({ ...testSuite, responseColumns }, isSkipRefresh);
    },
    [testSuite, onChangeTestSuite],
  );

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <div className="flex flex-row justify-between items-start mb-3">
        <h3>{t(TestSuitesI18nKey.EndpointSchema)}</h3>
        {activeSchemaTab !== EntityViewTab.Columns && (
          <DialSelect
            prefix={`${t(CompareI18nKey.View)}: `}
            size={SelectSize.Sm}
            variant={SelectVariant.Secondary}
            options={viewOptions}
            value={isJsonView ? 'json' : 'table'}
            onChange={onViewSelectChange}
          />
        )}
      </div>

      <div className="flex flex-row justify-between items-start mb-3">
        <DialTabs tabs={tabs} activeTab={activeSchemaTab} onClick={onChangeSchemaTab} />
      </div>

      {activeSchemaTab !== EntityViewTab.Columns ? (
        isJsonView ? (
          <div className="w-full h-[350px]">
            <JsonEditor
              entity={currentSchema as object}
              options={{ stickyScroll: { enabled: false } }}
              setSelectedEntity={onChangeSchema as Dispatch<SetStateAction<JSONSchema7>>}
            />
          </div>
        ) : (
          <SchemaGrid schema={currentSchema} onChange={onChangeSchema} isSkipRefresh={isSkipRefresh} />
        )
      ) : (
        <Columns
          responseColumns={testSuite.responseColumns || []}
          onChangeResponseColumns={onChangeResponseColumns}
          responseSchema={(testSuite.endpointRef?.responseBodySchema || {}) as JSONSchema7}
          isSkipRefresh={isSkipRefresh}
        />
      )}
    </div>
  );
};

export default EndpointSchema;
