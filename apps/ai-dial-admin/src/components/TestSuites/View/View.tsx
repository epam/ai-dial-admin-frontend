'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useRef, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { EntityViewTab, getTestSuiteTabs } from '@/src/utils/tabs/utils';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  names: string[];
  originalTestSuite: TestSuite;
}

const TestSuiteView: FC<Props> = ({ names, originalTestSuite }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs = getTestSuiteTabs(t);

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
        <HeaderButtons
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
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
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
