'use client';

import { DialInput, DialLabel, DialNumberInput, DialSelect } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import FileSelectInput from '@/src/components/Common/FileSelectInput/FileSelectInput';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InputBindingRowData, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';

interface Props {
  row: InputBindingRowData;
  schema?: TestCaseSchema[];
  showTypeSelector?: boolean;
  readonly?: boolean;
  testSuiteId?: string;
  onChangeValue: (row: InputBindingRowData, value: unknown) => void;
  onChangeType?: (row: InputBindingRowData, type: InputBindingType) => void;
  onChangeDataField?: (row: InputBindingRowData, dataField: string) => void;
}

const VariableRow: FC<Props> = ({
  row,
  schema,
  showTypeSelector,
  readonly,
  testSuiteId,
  onChangeValue,
  onChangeType,
  onChangeDataField,
}) => {
  const t = useI18n();

  const tabs = [
    { id: InputBindingType.Constant, label: t(TestSuitesI18nKey.Constant) },
    { id: InputBindingType.Attribute, label: t(TestSuitesI18nKey.Attribute) },
  ];

  const activeType = row.type ?? InputBindingType.Constant;
  const strValue = String(row.value ?? '');

  return (
    <div className="flex flex-col gap-1">
      <DialLabel label={row.templateVariable} />
      {showTypeSelector && !readonly && (
        <TabSelector
          tabs={tabs}
          activeTab={activeType}
          onChange={(tabId) => onChangeType?.(row, tabId as InputBindingType)}
        />
      )}
      {activeType === InputBindingType.Attribute ? (
        <DialSelect
          disabled={readonly}
          options={schema?.map((s) => ({ label: s.name, value: s.name })) ?? []}
          value={row.dataField as string | undefined}
          onChange={(v) => onChangeDataField?.(row, v as string)}
        />
      ) : row.effectiveType === TestCaseItemType.NUMBER || row.effectiveType === TestCaseItemType.INTEGER ? (
        <DialNumberInput
          disabled={readonly}
          integer={row.effectiveType === TestCaseItemType.INTEGER}
          value={strValue}
          onChange={(v) => onChangeValue(row, v !== undefined ? v : '')}
        />
      ) : row.effectiveType === TestCaseItemType.BOOLEAN ? (
        <DialSelect
          disabled={readonly}
          options={[
            { label: 'true', value: 'true' },
            { label: 'false', value: 'false' },
          ]}
          value={row.value != null ? strValue : undefined}
          onChange={(v) => onChangeValue(row, v === 'true')}
        />
      ) : row.effectiveType === TestCaseItemType.OBJECT || row.effectiveType === TestCaseItemType.ARRAY ? (
        <JsonEditorInput
          disabled={readonly}
          value={(row.value as object) || {}}
          onChangeValue={(v) => onChangeValue(row, v)}
          disableValidation
        />
      ) : row.effectiveType === TestCaseItemType.FILE ? (
        <FileSelectInput
          disabled={readonly}
          value={strValue}
          onChangeValue={(v) => onChangeValue(row, v)}
          id={testSuiteId}
          view={ApplicationRoute.TestSuites}
        />
      ) : (
        <DialInput disabled={readonly} value={strValue} onChange={(v) => onChangeValue(row, v ?? '')} />
      )}
    </div>
  );
};

export default VariableRow;
