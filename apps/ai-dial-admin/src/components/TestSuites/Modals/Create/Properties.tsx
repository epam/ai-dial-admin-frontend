'use client';

import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

interface Props {
  testSuite: TestSuite;
  onChangeTestSuite: (testSuite: TestSuite) => void;
}

const TestSuiteProperties: FC<Props> = ({ testSuite, onChangeTestSuite }) => {
  const t = useI18n();
  return (
    <div className="w-full flex flex-col gap-y-8">
      {/* TODO: replace to IdControl */}
      <DialTextInputField
        placeholder={t(EntityPlaceholdersI18nKey.Id)}
        fieldTitle={t(EntityFieldsI18nKey.id)}
        elementId="id"
        value={testSuite.id}
        onChange={(value) => onChangeTestSuite({ ...testSuite, id: value })}
      />

      <DisplayNameControl
        displayName={testSuite.name}
        required={true}
        isFullWidth={false}
        onChange={(name) => onChangeTestSuite({ ...testSuite, name })}
      />
      <DescriptionControl isFullWidth={false} entity={testSuite} onChangeEntity={onChangeTestSuite} />
    </div>
  );
};

export default TestSuiteProperties;
