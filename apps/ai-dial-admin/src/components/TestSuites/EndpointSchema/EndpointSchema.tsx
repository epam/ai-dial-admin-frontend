'use client';

import { FC, useCallback, useEffect, useMemo } from 'react';

import { JSONSchema7 } from 'json-schema';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn, TestSuite } from '@/src/models/evaluation/test-suite';
import { JsonataVariable } from '@/src/models/jsonata';
import { findDuplicateResponseColumnName } from '@/src/utils/evaluation/request-chain';
import Columns from './Columns/Columns';

const COLUMN_UNIQUENESS_FIELD = 'columnUniqueness';

// Stable fallbacks so a request with no columns/schema yet hands Columns the same reference on every
// render, instead of a new empty array/object each time — the latter fed Columns' memoized grid props
// a "changed" dependency every render, which (via its own effects) fed back into a re-render loop.
const EMPTY_RESPONSE_COLUMNS: ResponseColumn[] = [];
const EMPTY_RESPONSE_SCHEMA: JSONSchema7 = {};

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  jsonataVariables?: JsonataVariable[];
  takenColumnNames?: string[];
}

const EndpointSchema: FC<Props> = ({
  testSuite,
  onChangeTestSuite,
  isSkipRefresh,
  jsonataVariables,
  takenColumnNames = [],
}) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const duplicateColumn = useMemo(
    () => findDuplicateResponseColumnName(testSuite.responseColumns || [], takenColumnNames),
    [testSuite.responseColumns, takenColumnNames],
  );

  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: COLUMN_UNIQUENESS_FIELD,
      isValid: !duplicateColumn,
    });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: COLUMN_UNIQUENESS_FIELD });
    };
  }, [dispatch, duplicateColumn]);

  const onChangeResponseColumns = useCallback(
    (responseColumns: ResponseColumn[], isSkipRefresh?: boolean) => {
      onChangeTestSuite({ ...testSuite, responseColumns }, isSkipRefresh);
    },
    [testSuite, onChangeTestSuite],
  );

  return (
    <div className="flex flex-col size-full gap-4 border border-secondary rounded p-4">
      <h3>{t(TestSuitesI18nKey.EndpointSchema)}</h3>

      <Columns
        responseColumns={testSuite.responseColumns || EMPTY_RESPONSE_COLUMNS}
        onChangeResponseColumns={onChangeResponseColumns}
        responseSchema={(testSuite.endpointRef?.responseBodySchema || EMPTY_RESPONSE_SCHEMA) as JSONSchema7}
        isSkipRefresh={isSkipRefresh}
        jsonataVariables={jsonataVariables}
        duplicateColumn={duplicateColumn}
      />
    </div>
  );
};

export default EndpointSchema;
