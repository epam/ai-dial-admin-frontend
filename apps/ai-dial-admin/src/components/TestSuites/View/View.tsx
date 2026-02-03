'use client';

import { FC, useState } from 'react';

import { cloneDeep } from 'lodash';

import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab, getTestSuiteTabs } from '@/src/utils/tabs/utils';

interface Props {
  names: string[];
  originalTestSuite: TestSuite;
}

const TestSuiteView: FC<Props> = ({ originalTestSuite }) => {
  const t = useI18n();

  const tabs = getTestSuiteTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTestSuite, setSelectedTestSuite] = useState(cloneDeep(originalTestSuite));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isChanged, setIsChanged] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isEditorEnabled)}>
        <Tabs tabs={tabs} isEditorEnabled={isEditorEnabled} activeTab={activeTab} onChangeActiveTab={setActiveTab} />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedTestSuite}
            setSelectedEntity={setSelectedTestSuite}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && <div>Properties</div>}
            {activeTab === EntityViewTab.TestCases && <div>Test Cases</div>}
            {activeTab === EntityViewTab.Runs && <div>Runs</div>}
            {activeTab === EntityViewTab.Trends && <div>Trends</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default TestSuiteView;
