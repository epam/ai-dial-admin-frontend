import { FC, useCallback, useState } from 'react';

import { DialLabel, DialSelect } from '@epam/ai-dial-ui-kit';

import TabSelector from '@/src/components/Common/TabSelector/TabSelector';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { MetricBindingType } from '@/src/types/evaluation';
import MetricControl from './MetricControl';

interface Props {
  title: string;
  bindings?: MetricBinding[];
  fields: SchemaFieldRow[];
  selectedTestSuite?: TestSuite;
  onChange?: (bindings: MetricBinding[]) => void;
}

const MetricInputs: FC<Props> = ({ selectedTestSuite, fields, title, bindings, onChange }) => {
  if (!fields.length) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <p className="dial-small-semi mb-4">{title}</p>
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <MetricInput
            key={field.id}
            field={field}
            binding={bindings?.find((b) => b.property === field.name)}
            selectedTestSuite={selectedTestSuite}
            onChange={(binding) => {
              const updatedBindings = bindings?.map((b) => (b.property === field.name ? binding : b));
              onChange?.(updatedBindings || []);
            }}
          />
        ))}
      </div>
    </div>
  );
};

const MetricInput: FC<{
  field: SchemaFieldRow;
  binding?: MetricBinding;
  selectedTestSuite?: TestSuite;
  onChange: (binding: MetricBinding) => void;
}> = ({ field, binding, selectedTestSuite, onChange }) => {
  const t = useI18n();

  const tabs = [
    { label: t(TestSuitesI18nKey.TestCases), id: MetricBindingType.TestCase },
    { label: t(TestSuitesI18nKey.ResponseColumn), id: MetricBindingType.Response },
    { label: t(TestSuitesI18nKey.Constant), id: MetricBindingType.Constant },
  ];
  const [activeTab, setActiveTab] = useState(binding?.source.$type || tabs[0].id);

  const onChangeColumn = useCallback(
    (value: string) => {
      onChange({ ...binding, source: { $type: MetricBindingType.Response, columnName: value } } as MetricBinding);
    },
    [onChange, binding],
  );

  const onChangeTestCase = useCallback(
    (value: string) => {
      onChange({ ...binding, source: { $type: MetricBindingType.TestCase, columnName: value } } as MetricBinding);
    },
    [onChange, binding],
  );

  const onChangeConstant = useCallback(
    (value: string) => {
      onChange({ ...binding, source: { $type: MetricBindingType.Constant, value } } as MetricBinding);
    },
    [onChange, binding],
  );

  const onReset = useCallback(
    (tab: MetricBindingType) => {
      onChange({ ...binding, source: { $type: tab } } as MetricBinding);
    },
    [onChange, binding],
  );

  return (
    <div className="flex flex-col gap-2">
      <DialLabel label={field.name} caption={field.description} required={field.required} />
      <TabSelector
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => {
          onReset(tabId as MetricBindingType);
          setActiveTab(tabId as MetricBindingType);
        }}
      />

      {binding?.source.$type === MetricBindingType.Constant && (
        <MetricControl
          label={false}
          field={field}
          binding={binding}
          onChangeValue={(_field, value) => onChangeConstant(value as string)}
        />
      )}

      {binding?.source.$type === MetricBindingType.Response && (
        <DialSelect
          elementId={field.id}
          options={
            selectedTestSuite?.responseColumns?.map((item) => ({ label: item.displayName, value: item.name })) || []
          }
          value={binding?.source.columnName as string | undefined}
          onChange={(v) => onChangeColumn(v as string)}
        />
      )}

      {binding?.source.$type === MetricBindingType.TestCase && (
        <DialSelect
          elementId={field.id}
          options={selectedTestSuite?.testCaseSchema?.map((item) => ({ label: item.name, value: item.name })) || []}
          value={binding?.source.value as string | undefined}
          onChange={(v) => onChangeTestCase(v as string)}
        />
      )}
    </div>
  );
};

export default MetricInputs;
