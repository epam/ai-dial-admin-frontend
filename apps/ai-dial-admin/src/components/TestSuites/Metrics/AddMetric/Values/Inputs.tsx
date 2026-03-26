import { FC, useCallback, useState } from 'react';

import { DialLabel, DialSelect } from '@epam/ai-dial-ui-kit';
import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';

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
      onChange({ ...binding, source: { $type: MetricBindingType.TestCase, value } } as MetricBinding);
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

  console.log('binding', binding);
  return (
    <div className="flex flex-col gap-2">
      <DialLabel label={field.name} caption={field.description} required={field.required} />
      <div className="flex flex-row items-center bg-layer-4 rounded w-fit p-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={classNames(
              'flex flex-row gap-1 h-[24px] items-center py-1 px-2 text-primary cursor-pointer hover:bg-accent-primary-alpha',
              activeTab === tab.id && 'bg-accent-primary-alpha rounded',
            )}
            onClick={() => {
              onReset(tab.id);
              setActiveTab(tab.id);
            }}
          >
            {activeTab === tab.id && <IconCheck size={16} />}
            <div className="dial-small-text">{tab.label}</div>
          </div>
        ))}
      </div>

      {binding?.source.$type === MetricBindingType.Constant && (
        <MetricControl label={false} field={field} binding={binding} onChangeValue={onChangeConstant} />
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
