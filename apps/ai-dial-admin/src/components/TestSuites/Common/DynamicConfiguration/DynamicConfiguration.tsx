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
  containerClassName?: string;
  contentClassName?: string;
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
  containerClassName,
  contentClassName,
  onChangeValue,
  onChangeType,
  onChangeDataField,
}) => {
  const t = useI18n();

  return (
    <Accordion title={t(TestSuitesI18nKey.DynamicConfiguration)} collapsed={false} contentClassName={contentClassName}>
      {loading ? (
        <DialLoader size={40} />
      ) : rows.length === 0 ? (
        <p className={classNames('body text-secondary', containerClassName)}>{t(BasicI18nKey.NoVariables)}</p>
      ) : (
        <div className={classNames('flex flex-col gap-4', containerClassName)}>
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
