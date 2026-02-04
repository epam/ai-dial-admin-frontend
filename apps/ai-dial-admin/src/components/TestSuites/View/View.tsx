'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';

import { removeTestSuite, updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTestSuiteTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';

interface Props {
  originalTestSuite: TestSuite;
}

const TestSuiteView: FC<Props> = ({ originalTestSuite }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs = getTestSuiteTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTestSuite, setSelectedTestSuite] = useState(cloneDeep(originalTestSuite));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  const onDiscard = useCallback(() => {
    setSelectedTestSuite(cloneDeep(originalTestSuite));
  }, [originalTestSuite]);

  const onSave = useCallback(() => {
    updateTestSuite(selectedTestSuite).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.TestSuites, t),
            getUpdateNotificationDescription(ApplicationRoute.TestSuites, selectedTestSuite.id, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedTestSuite, showNotification, router, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.TestSuites}
        entity={selectedTestSuite}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeTestSuite}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedTestSuite}
            setSelectedEntity={setSelectedTestSuite}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent activeTab={activeTab} selectedTestSuite={selectedTestSuite} onChange={setSelectedTestSuite} />
        )}
      </div>
    </div>
  );
};

export default TestSuiteView;
