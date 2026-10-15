import { DialLabel, DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import AttributeSamplesPreview from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeSamplesPreview';
import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { BindingSourceValue, MetricBinding } from '@/src/models/evaluation/metric';
import { ResponseColumn, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { MetricBindingType } from '@/src/types/evaluation';
import { getChainResponseColumns } from '@/src/utils/evaluation/request-chain';
import MetricControl from './MetricControl';
import MetricSectionTabs from './MetricSectionTabs';
import TypedBindingSelect from './TypedBindingSelect';
import { formatDataTypeLabel, toTypedSelectOption } from './typedSelectOptions';

interface Props {
  title: string;
  bindings?: MetricBinding[];
  fields: SchemaFieldRow[];
  schema?: object;
  selectedTestSuite?: TestSuite;
  testCaseSchema?: TestCaseSchema[];
  samples?: AttributeSamples;
  onChange?: (bindings: MetricBinding[]) => void;
}

const MetricInputs: FC<Props> = ({
  selectedTestSuite,
  testCaseSchema,
  fields,
  title,
  bindings,
  schema,
  samples,
  onChange,
}) => {
  if (!fields.length && !schema) {
    return null;
  }

  const controlsContent = (
    <div className="flex flex-col gap-4">
      {fields.map((field) => (
        <MetricInput
          key={field.id}
          field={field}
          binding={bindings?.find((b) => b.property === field.name)}
          selectedTestSuite={selectedTestSuite}
          testCaseSchema={testCaseSchema}
          samples={samples}
          onChange={(binding) => {
            const updatedBindings = bindings?.map((b) => (b.property === field.name ? binding : b));
            onChange?.(updatedBindings || []);
          }}
        />
      ))}
    </div>
  );

  return <MetricSectionTabs title={title} schema={schema} controlsContent={controlsContent} />;
};

const MetricInput: FC<{
  field: SchemaFieldRow;
  binding?: MetricBinding;
  selectedTestSuite?: TestSuite;
  testCaseSchema?: TestCaseSchema[];
  samples?: AttributeSamples;
  onChange: (binding: MetricBinding) => void;
}> = ({ field, binding, selectedTestSuite, testCaseSchema, samples, onChange }) => {
  const t = useI18n();
  const selectPlaceholder = t(EntityPlaceholdersI18nKey.Select);

  const bindingTypeOptions = useMemo<SegmentedControlOption<MetricBindingType>[]>(
    () => [
      { value: MetricBindingType.TestCase, label: t(TestSuitesI18nKey.TestCase) },
      { value: MetricBindingType.Response, label: t(TestSuitesI18nKey.ResponseColumn) },
      { value: MetricBindingType.Constant, label: t(TestSuitesI18nKey.Constant) },
    ],
    [t],
  );
  const [activeTab, setActiveTab] = useState(binding?.source.$type || MetricBindingType.TestCase);

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
    (value: BindingSourceValue) => {
      onChange({ ...binding, source: { $type: MetricBindingType.Constant, value } } as MetricBinding);
    },
    [onChange, binding],
  );

  const onBindingTypeChange = useCallback(
    (tab: MetricBindingType) => {
      onChange({ ...binding, source: { $type: tab } } as MetricBinding);
      setActiveTab(tab);
    },
    [onChange, binding],
  );

  const testCaseOptions = useMemo(() => {
    const schema = testCaseSchema ?? [];
    return schema.map((item) => {
      const values = samples?.valuesByField[item.name] ?? [];
      return toTypedSelectOption({
        value: item.name,
        label: item.name,
        type: item.type,
        interactiveTooltip:
          values.length > 0
            ? {
                content: (
                  <AttributeSamplesPreview
                    title={item.name}
                    type={formatDataTypeLabel(item.type)}
                    values={values}
                    totalCount={samples?.totalCount ?? 0}
                  />
                ),
              }
            : undefined,
      });
    });
  }, [testCaseSchema, samples]);

  const responseOptions = useMemo(() => {
    const columns: ResponseColumn[] = selectedTestSuite ? getChainResponseColumns(selectedTestSuite) : [];
    return columns.map((item) =>
      toTypedSelectOption({
        value: item.name,
        label: item.displayName,
        type: item.type,
        interactiveTooltip: {
          content: (
            <div className="flex flex-col gap-1 min-w-[200px] text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary truncate">{item.displayName}</span>
                <span className="text-secondary">{formatDataTypeLabel(item.type)}</span>
              </div>
              {item.expression ? <p className="text-secondary break-all">{item.expression}</p> : null}
            </div>
          ),
        },
      }),
    );
  }, [selectedTestSuite]);

  return (
    <div className="flex flex-col gap-1">
      <DialLabel label={field.name} caption={field.description} required={field.required} />
      <div className="w-fit mb-2">
        <DialSegmentedControl
          ariaLabel={field.name}
          options={bindingTypeOptions}
          value={activeTab}
          onChange={onBindingTypeChange}
        />
      </div>

      {binding?.source.$type === MetricBindingType.Constant && (
        <MetricControl
          label={false}
          field={field}
          binding={binding}
          onChangeValue={(_field, value) => onChangeConstant(value)}
        />
      )}

      {binding?.source.$type === MetricBindingType.Response && (
        <TypedBindingSelect
          elementId={field.id}
          options={responseOptions}
          value={binding?.source.columnName as string | undefined}
          placeholder={selectPlaceholder}
          onChange={onChangeColumn}
        />
      )}

      {binding?.source.$type === MetricBindingType.TestCase && (
        <TypedBindingSelect
          elementId={field.id}
          options={testCaseOptions}
          value={binding?.source.columnName as string | undefined}
          placeholder={selectPlaceholder}
          onChange={onChangeTestCase}
        />
      )}
    </div>
  );
};

export default MetricInputs;
