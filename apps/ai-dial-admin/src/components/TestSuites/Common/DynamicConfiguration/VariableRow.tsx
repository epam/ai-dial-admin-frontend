'use client';

import { DialInput, DialLabel, DialNumberInput, DialSelect, DialTooltip } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import FileSelectInput from '@/src/components/Common/FileSelectInput/FileSelectInput';
import JsonEditorInput from '@/src/components/Common/JsonEditorInput/JsonEditorInput';
import TabSelector from '@/src/components/Common/TabSelector/TabSelector';
import AttributeSelect from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeSelect';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { InputBindingRowData, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { InputBindingType, TestCaseItemType } from '@/src/types/evaluation';
import { IconInfoCircle } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  row: InputBindingRowData;
  schema?: TestCaseSchema[];
  samples?: AttributeSamples;
  showTypeSelector?: boolean;
  readonly?: boolean;
  testSuiteId?: string;
  onChangeValue: (row: InputBindingRowData, value: unknown) => void;
  onChangeType?: (row: InputBindingRowData, type: InputBindingType) => void;
  onChangeDataField?: (row: InputBindingRowData, dataField: string) => void;
  info?: string;
}

const VariableRow: FC<Props> = ({
  row,
  schema,
  samples,
  showTypeSelector,
  readonly,
  testSuiteId,
  onChangeValue,
  onChangeType,
  onChangeDataField,
  info,
}) => {
  const t = useI18n();

  const tabs = [
    { id: InputBindingType.Attribute, label: t(TestSuitesI18nKey.TestCaseColumns) },
    { id: InputBindingType.Constant, label: t(TestSuitesI18nKey.Constant) },
  ];

  const activeType = row.type ?? InputBindingType.Constant;
  const strValue = String(row.value ?? '');

  return (
    <div className="flex flex-col gap-3">
      <span>
        <DialLabel label={row.templateVariable} />
        {!!info && (
          <DialTooltip tooltip={info}>
            <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} size={16} className="text-secondary" />
          </DialTooltip>
        )}
      </span>
      {showTypeSelector && !readonly && (
        <TabSelector
          clearView
          tabs={tabs}
          activeTab={activeType}
          onChange={(tabId) => onChangeType?.(row, tabId as InputBindingType)}
        />
      )}
      {activeType === InputBindingType.Attribute ? (
        <AttributeSelect
          disabled={readonly}
          schema={schema ?? []}
          samples={samples}
          value={row.dataField}
          onChange={(dataField) => onChangeDataField?.(row, dataField)}
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
