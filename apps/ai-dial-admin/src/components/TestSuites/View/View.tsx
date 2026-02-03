/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { FC, useCallback, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab, getAdapterTabs } from '@/src/utils/tabs/utils';

interface Props {
  names: string[];
  originalTestSuite: TestSuite;
}

const TestSuiteView: FC<Props> = ({ originalTestSuite }) => {
  const t = useI18n();

  const tabs = getAdapterTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTestSuite, setSelectedTestSuite] = useState(cloneDeep(originalTestSuite));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        {!isJsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        {/* <HeaderButtons
          view={ApplicationRoute.TestSuites}
          entity={selectedTestSuite}
          isChanged={isChanged}
          // onDiscard={onDiscard}
          // onSave={onTryToSave}
          // onRemove={removeToolset}
          // isJsonEditorEnabled={isJsonEditorEnabled}
          // onToggleJsonEditor={onToggleJsonEditor}
          // selectedFormat={selectedFormat}
          // onChangeSelectedFormat={setSelectedFormat}
        /> */}
      </div>
      {/* <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedTestSuite}
            setSelectedEntity={setSelectedTestSuite}
            setIsChanged={setIsChanged}
          />
        ) : (
          // <>
          //   {activeTab === EntityViewTab.Properties && <div>Properties</div>}
          //   {activeTab === EntityViewTab.TestCases && <div>Test Cases</div>}
          //   {activeTab === EntityViewTab.Runs && <div>Runs</div>}
          //   {activeTab === EntityViewTab.Trends && <div>Trends</div>}
          // </>
        )}
      </div> */}
    </div>
  );
};

export default TestSuiteView;
