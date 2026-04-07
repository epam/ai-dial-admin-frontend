'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialSelect, DialTabs, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import JsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import TableView from '@/src/components/Common/ViewSelector/TableView';
import Columns from '@/src/components/TestSuites/EndpointSchema/Columns/Columns';
import { TOOL_SCHEMA_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { CompareI18nKey, EntitiesI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialScheme } from '@/src/models/dial/scheme';
import { ResponseColumn, TestSuite } from '@/src/models/evaluation/test-suite';
import { EntityViewTab, getMcpToolSchemaTabs } from '@/src/utils/tabs/utils';
import { convertSchemaToTable } from '@/src/utils/schema';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
}

const McpToolSchema: FC<Props> = ({ testSuite, onChangeTestSuite, isSkipRefresh }) => {
  const t = useI18n();
  const tabs = getMcpToolSchemaTabs(t);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [isJsonView, setIsJsonView] = useState(false);

  const SCHEMA_COLUMNS = useMemo(() => TOOL_SCHEMA_COLUMNS(t), [t]);

  const viewOptions: SelectOption[] = [
    { value: 'table', label: t(EntitiesI18nKey.Table) },
    { value: 'json', label: 'JSON' },
  ];

  const onChangeTab = useCallback((id: string) => {
    setActiveTab(id);
    if (id === EntityViewTab.Columns) {
      setIsJsonView(false);
    }
  }, []);

  const onViewSelectChange = useCallback((value: string | string[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    setIsJsonView(v === 'json');
  }, []);

  const toolRef = testSuite.toolRef;

  const currentSchema = useMemo(() => {
    if (activeTab === EntityViewTab.InputSchema) return toolRef?.inputSchema;
    if (activeTab === EntityViewTab.OutputSchema) return toolRef?.outputSchema;
    return undefined;
  }, [activeTab, toolRef]);

  const schemaRows = useMemo(() => convertSchemaToTable(currentSchema as DialScheme | undefined), [currentSchema]);

  const onChangeResponseColumns = useCallback(
    (responseColumns: ResponseColumn[], isSkipRefresh?: boolean) => {
      onChangeTestSuite({ ...testSuite, responseColumns }, isSkipRefresh);
    },
    [testSuite, onChangeTestSuite],
  );

  const isSchemaTab = activeTab === EntityViewTab.InputSchema || activeTab === EntityViewTab.OutputSchema;

  return (
    <div className="flex flex-col size-full gap-2 border border-primary rounded p-4">
      <div className="flex flex-row justify-between items-start mb-3">
        <h3>{t(TestSuitesI18nKey.ToolSchema)}</h3>
        {isSchemaTab && (
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
        <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeTab} />
      </div>

      {isSchemaTab ? (
        isJsonView ? (
          <div className="w-full h-[350px]">
            <JsonEditor
              entity={(currentSchema as object) || {}}
              options={{ stickyScroll: { enabled: false } }}
              readonly={true}
            />
          </div>
        ) : (
          !!schemaRows.length && <TableView title="" columnDefs={SCHEMA_COLUMNS} rowData={schemaRows} />
        )
      ) : (
        <Columns
          responseColumns={testSuite.responseColumns || []}
          onChangeResponseColumns={onChangeResponseColumns}
          responseSchema={(toolRef?.outputSchema || {}) as JSONSchema7}
          isSkipRefresh={isSkipRefresh}
        />
      )}
    </div>
  );
};

export default McpToolSchema;
