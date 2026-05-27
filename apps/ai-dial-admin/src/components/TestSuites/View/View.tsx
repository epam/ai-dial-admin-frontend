'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { batchPutDatasetTestCases } from '@/src/app/[lang]/datasets/actions';
import { removeTestSuite, runTestSuite, updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import RunModal from '@/src/components/TestSuites/Runs/RunModal';
import { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
import { ButtonsI18nKey, TestSuitesI18nKey, UpdateI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestCaseBatchPutItem, TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTestSuiteTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  originalTestSuite: TestSuite;
  etag: string;
}

const TestSuiteView: FC<Props> = ({ originalTestSuite, etag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const runRefreshRef = useRef<(() => void) | null>(null);
  const testCasesActionsRef = useRef<TestCasesActions | null>(null);
  const tabs = getTestSuiteTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedTestSuite, setSelectedTestSuite] = useState(structuredClone(originalTestSuite));
  const [isChanged, setIsChanged] = useState(false);
  const [hasTestCaseChanges, setHasTestCaseChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalTestSuite, selectedTestSuite) || hasTestCaseChanges);
  }, [originalTestSuite, selectedTestSuite, hasTestCaseChanges]);

  useEffect(() => {
    setSelectedTestSuite(structuredClone(originalTestSuite));
  }, [originalTestSuite]);

  const onDiscard = useCallback(() => {
    setSelectedTestSuite(structuredClone(originalTestSuite));
    setHasTestCaseChanges(false);
    setIsSkipRefresh(false);
    testCasesActionsRef.current?.clearDirtyAndRefresh();
  }, [originalTestSuite]);

  const onSave = useCallback(async () => {
    const showSuccessAndRefresh = (testCasesSavedCount: number) => {
      const baseDescription = getUpdateNotificationDescription(ApplicationRoute.TestSuites, selectedTestSuite.id, t);
      const description =
        testCasesSavedCount > 0
          ? `${baseDescription} ${t(UpdateI18nKey.TestCasesSavedSuffix, { count: String(testCasesSavedCount) })}`
          : baseDescription;
      showNotification(getSuccessNotification(getUpdateNotificationTitle(ApplicationRoute.TestSuites, t), description));
      router.refresh();
    };

    const handleError = (header: string | undefined, message: string | undefined, requestId?: string) => {
      showNotification(getErrorNotification(header, message, requestId));
      router.refresh();
    };

    const suiteDirty = !isEqualSkippingUndefined(originalTestSuite, selectedTestSuite);
    if (suiteDirty) {
      const suiteRes = await updateTestSuite(selectedTestSuite, etag);
      if (!suiteRes.success) {
        handleError(suiteRes.errorHeader, suiteRes.errorMessage, suiteRes.requestId);
        return;
      }
    }

    const dirtyCases = testCasesActionsRef.current?.getDirtyTestCases() ?? [];
    if (dirtyCases.length > 0 && selectedTestSuite.datasetId) {
      const items: TestCaseBatchPutItem[] = dirtyCases.map((tc: TestCase) => ({
        id: tc.id,
        testCaseName: tc.testCaseName,
        data: tc.data,
      }));
      const tcRes = await batchPutDatasetTestCases(selectedTestSuite.datasetId, items);
      if (!tcRes?.success) {
        handleError(tcRes?.errorHeader, tcRes?.errorMessage, tcRes?.requestId);
        return;
      }
    }

    testCasesActionsRef.current?.clearDirtyAndRefresh();
    setHasTestCaseChanges(false);
    showSuccessAndRefresh(dirtyCases.length);
  }, [originalTestSuite, selectedTestSuite, etag, showNotification, t, router]);

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
          setIsModalOpen(false);
          setTimeout(() => {
            runRefreshRef.current?.();
          }, 500);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [selectedTestSuite.id, showNotification, t],
  );

  const onChangeTestSuite = useCallback(
    (testSuite: TestSuite, isSkipRefresh = false) => {
      setSelectedTestSuite(testSuite);
      setIsSkipRefresh(isSkipRefresh);
    },
    [setSelectedTestSuite, setIsSkipRefresh],
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
            disabled={!selectedTestSuite.valid || !selectedTestSuite.datasetId}
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
            <TabsContent
              runRefreshRef={runRefreshRef}
              testCasesActionsRef={testCasesActionsRef}
              onTestCaseDirtyChange={setHasTestCaseChanges}
              isSkipRefresh={isSkipRefresh}
              activeTab={activeTab}
              selectedTestSuite={selectedTestSuite}
              originalTestSuite={originalTestSuite}
              onChange={onChangeTestSuite}
            />
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
