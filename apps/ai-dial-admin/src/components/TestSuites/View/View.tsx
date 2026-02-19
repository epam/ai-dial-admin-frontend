'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { removeTestSuite, runTestSuite, updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTestSuiteTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';
import { createPortal } from 'react-dom';
import RunModal from '../Runs/RunModal';

interface Props {
  originalTestSuite: TestSuite;
  etag: string;
}

const TestSuiteView: FC<Props> = ({ originalTestSuite, etag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs = getTestSuiteTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTestSuite, setSelectedTestSuite] = useState(structuredClone(originalTestSuite));
  const [isChanged, setIsChanged] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalTestSuite, selectedTestSuite));
  }, [originalTestSuite, selectedTestSuite]);

  useEffect(() => {
    setSelectedTestSuite(structuredClone(originalTestSuite));
  }, [originalTestSuite]);

  const onDiscard = useCallback(() => {
    setSelectedTestSuite(structuredClone(originalTestSuite));
  }, [originalTestSuite]);

  const onSave = useCallback(() => {
    updateTestSuite(selectedTestSuite, etag).then((res) => {
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
  }, [selectedTestSuite, etag, showNotification, t, router]);

  const onStartRunTestSuite = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onRun = useCallback(
    (num?: string | number) => {
      runTestSuite(selectedTestSuite.id, num).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.RunSuccess), t(TestSuitesI18nKey.RunSuccessDescription)),
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [selectedTestSuite.id, showNotification, t],
  );

  return (
    <>
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
        >
          <DialNeutralButton
            label={t(ButtonsI18nKey.Run)}
            iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onStartRunTestSuite}
            disabled={!selectedTestSuite.valid}
          />
        </SimpleEntityHeader>

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

      {isModalOpen &&
        createPortal(
          <RunModal
            selectedTestSuite={selectedTestSuite}
            isModalOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onRun={onRun}
          />,
          document.body,
        )}
    </>
  );
};

export default TestSuiteView;
