'use client';

import { FC, useMemo } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import TestSuiteProperties from './Properties';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const PropertiesTabContent: FC<Props> = ({ selectedTestSuite, onChange }) => {
  const t = useI18n();

  const headerPrefix = useMemo(() => {
    return <LabelledText copyable={true} label={t(EntityFieldsI18nKey.name)} text={selectedTestSuite.name} />;
  }, [selectedTestSuite.name, t]);

  return (
    <div className="flex flex-col">
      <EntityInfoHeader id={selectedTestSuite.id} entity={selectedTestSuite} prefix={headerPrefix} />

      <div className="flex-1 min-h-0 pt-8">
        <TestSuiteProperties testSuite={selectedTestSuite} onChange={onChange} />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
