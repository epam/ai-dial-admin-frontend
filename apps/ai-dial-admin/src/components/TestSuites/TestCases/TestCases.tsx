'use client';

import { FC, RefObject, useMemo } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import TestCasesList, { TestCasesActions } from './TestCasesList';
import TemplateVariables from './TemplateVariables';

interface Props {
  selectedTestSuite: TestSuite;
  originalTestSuite?: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite, originalTestSuite, onChange, isSkipRefresh, ...props }) => {
  const t = useI18n();
  const isNotSaved = useMemo(() => {
    return !isEqual(selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate);
  }, [selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate]);

  return (
    <div className="h-full flex flex-col gap-y-6">
      <TemplateVariables selectedTestSuite={selectedTestSuite} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      <TestCasesList
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
        isSkipRefresh={isSkipRefresh}
        {...props}
      />
      {isNotSaved && <DialAlert variant={AlertVariant.Info} message={t(TestSuitesI18nKey.Warning)} />}
    </div>
  );
};

export default TestCases;
