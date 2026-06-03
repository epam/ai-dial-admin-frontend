'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { getDataset, updateDataset, updateTestCases } from '@/src/app/[lang]/datasets/actions';
import { removeTestSuite, runTestSuite, updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import RunModal from '@/src/components/TestSuites/Runs/RunModal';
import { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
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
  const [discardKey, setDiscardKey] = useState(0);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasetEtag, setDatasetEtag] = useState(DEFAULT_ETAG);

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

  useEffect(() => {
    if (!originalTestSuite.datasetId) {
      setDataset(null);
      setDatasetEtag(DEFAULT_ETAG);
      return;
    }
    getDataset(originalTestSuite.datasetId, DEFAULT_ETAG).then((res) => {
      if (res?.response) {
        setDataset(res.response as Dataset);
        setDatasetEtag(res.etag ?? DEFAULT_ETAG);
      }
    });
  }, [originalTestSuite.datasetId]);

  const onChangeDataset = useCallback((updatedDataset: Dataset) => {
    setDataset(updatedDataset);
  }, []);

  const onDiscard = useCallback(() => {
    setSelectedTestSuite(structuredClone(originalTestSuite));
    setHasTestCaseChanges(false);
    setIsSkipRefresh(false);
    setDiscardKey((prev) => prev + 1);
    testCasesActionsRef.current?.clearDirtyAndRefresh();
    if (originalTestSuite.datasetId) {
      getDataset(originalTestSuite.datasetId, DEFAULT_ETAG).then((res) => {
        if (res?.response) {
          setDataset(res.response as Dataset);
          setDatasetEtag(res.etag ?? DEFAULT_ETAG);
        }
      });
    }
  }, [originalTestSuite]);

  const onSave = useCallback(() => {
    const showSuccessAndRefresh = () => {
      showNotification(
        getSuccessNotification(
          getUpdateNotificationTitle(ApplicationRoute.TestSuites, t),
          getUpdateNotificationDescription(ApplicationRoute.TestSuites, selectedTestSuite.id, t),
        ),
      );
      router.refresh();
    };

    const handleError = (header: string | undefined, message: string | undefined, requestId?: string) => {
      showNotification(getErrorNotification(header, message, requestId));
      router.refresh();
    };

    updateTestSuite(selectedTestSuite, etag).then((suiteRes) => {
      if (!suiteRes.success) {
        handleError(suiteRes.errorHeader, suiteRes.errorMessage, suiteRes.requestId);
        return;
      }

      const dirtyTestCases = testCasesActionsRef.current?.getDirtyTestCases() ?? [];
      const datasetId = selectedTestSuite.datasetId;

      const afterTestCases = () => {
        if (dataset && datasetId) {
          updateDataset(dataset, datasetEtag).then((datasetRes) => {
            if (!datasetRes.success) {
              handleError(datasetRes.errorHeader, datasetRes.errorMessage, datasetRes.requestId);
              return;
            }
            showSuccessAndRefresh();
          });
        } else {
          showSuccessAndRefresh();
        }
      };

      if (dirtyTestCases.length > 0 && datasetId) {
        updateTestCases(datasetId, dirtyTestCases).then((testCasesRes) => {
          if (!testCasesRes.success) {
            handleError(testCasesRes.errorHeader, testCasesRes.errorMessage, testCasesRes.requestId);
            return;
          }
          testCasesActionsRef.current?.clearDirtyAndRefresh();
          setHasTestCaseChanges(false);
          afterTestCases();
        });
      } else {
        testCasesActionsRef.current?.clearDirtyAndRefresh();
        setHasTestCaseChanges(false);
        afterTestCases();
      }
    });
  }, [selectedTestSuite, etag, showNotification, t, router, dataset, datasetEtag]);

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
            disabled={!selectedTestSuite.valid}
          />
        </SimpleEntityHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {isEditorEnabled ? (
            <EntityJsonEditor
              key={discardKey}
              entity={selectedTestSuite}
              setSelectedEntity={setSelectedTestSuite}
              setIsChanged={setIsChanged}
            />
          ) : (
            <TabsContent
              key={discardKey}
              runRefreshRef={runRefreshRef}
              testCasesActionsRef={testCasesActionsRef}
              onTestCaseDirtyChange={setHasTestCaseChanges}
              isSkipRefresh={isSkipRefresh}
              activeTab={activeTab}
              selectedTestSuite={selectedTestSuite}
              originalTestSuite={originalTestSuite}
              onChange={onChangeTestSuite}
              dataset={dataset}
              onChangeDataset={onChangeDataset}
              suiteEtag={etag}
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
