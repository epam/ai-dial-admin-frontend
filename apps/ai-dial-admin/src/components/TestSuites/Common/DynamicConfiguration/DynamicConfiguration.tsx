'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import { FC } from 'react';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { InputBindingRowData, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { InputBindingType } from '@/src/types/evaluation';
import VariableRow from './VariableRow';

interface Props {
  testSuiteId?: string;
  rows: InputBindingRowData[];
  schema?: TestCaseSchema[];
  showTypeSelector?: boolean;
  readonly?: boolean;
  loading?: boolean;
  title?: string;
  collapsible?: boolean;
  containerClassName?: string;
  contentClassName?: string;
  contentPaddingClassName?: string;
  accordionContainerClassName?: string;
  onChangeValue: (row: InputBindingRowData, value: unknown) => void;
  onChangeType?: (row: InputBindingRowData, type: InputBindingType) => void;
  onChangeDataField?: (row: InputBindingRowData, dataField: string) => void;
}

const DynamicConfiguration: FC<Props> = ({
  testSuiteId,
  rows,
  schema,
  showTypeSelector,
  readonly,
  loading,
  title,
  collapsible = true,
  containerClassName,
  contentClassName,
  contentPaddingClassName,
  onChangeValue,
  onChangeType,
  onChangeDataField,
  accordionContainerClassName,
}) => {
  const t = useI18n();

  return (
    <Accordion
      title={title ?? t(TestSuitesI18nKey.DynamicConfiguration)}
      collapsed={false}
      collapsible={collapsible}
      contentClassName={contentClassName}
      contentPaddingClassName={contentPaddingClassName}
      containerClassName={accordionContainerClassName}
    >
      {loading ? (
        <DialLoader size={40} />
      ) : rows.length === 0 ? (
        <p className={classNames('body text-secondary', containerClassName)}>{t(BasicI18nKey.NoVariables)}</p>
      ) : (
        <div className={classNames('flex flex-col gap-6', containerClassName)}>
          {rows.map((row) => (
            <VariableRow
              key={row.templateVariable}
              row={row}
              schema={schema}
              showTypeSelector={showTypeSelector}
              readonly={readonly}
              testSuiteId={testSuiteId}
              onChangeValue={onChangeValue}
              onChangeType={onChangeType}
              onChangeDataField={onChangeDataField}
            />
          ))}
        </div>
      )}
    </Accordion>
  );
};

export default DynamicConfiguration;
