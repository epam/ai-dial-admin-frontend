'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';
import { useRouter } from 'next/navigation';

import {
  batchPutDatasetTestCases,
  getDataset,
  patchDatasetVisibility,
  removeDataset,
  updateDataset,
} from '@/src/app/[lang]/datasets/actions';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import ApplicationFileManager from '@/src/components/Common/FileSelectInput/ApplicationFileManager';
import RevalidationTaskIndicator from '@/src/components/Common/RevalidationTaskIndicator';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import PropertiesTabContent from '@/src/components/EntityTabs/PropertiesTabContent';
import TestCasesList, { TestCasesActions } from '@/src/components/TestSuites/TestCases/TestCasesList';
import SchemaManager from '@/src/components/TestSuites/TestCaseSchema/SchemaManager';
import { DatasetsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, RevalidationTask } from '@/src/models/evaluation/dataset';
import { TestCase, TestCaseBatchPutItem, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { DatasetVisibility } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import { pollRevalidationTask } from '@/src/utils/api/revalidation-polling';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getDatasetTabs } from '@/src/utils/tabs/utils';

interface Props {
  originalDataset: Dataset;
  etag: string;
}

const DatasetView: FC<Props> = ({ originalDataset, etag: initialEtag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification, removeNotification } = useNotification();

  const tabs = getDatasetTabs(t);
  const testCasesActionsRef = useRef<TestCasesActions | null>(null);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [dataset, setDataset] = useState<Dataset>(structuredClone(originalDataset));
  const [etag, setEtag] = useState(initialEtag);
  const [isChanged, setIsChanged] = useState(false);
  const [hasTestCaseChanges, setHasTestCaseChanges] = useState(false);
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [revalidationTask, setRevalidationTask] = useState<RevalidationTask | null>(null);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({ isEditorEnabled: false, onToggleEditor: () => undefined }),
    [],
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalDataset, dataset) || hasTestCaseChanges);
  }, [originalDataset, dataset, hasTestCaseChanges]);

  useEffect(() => {
    setDataset(structuredClone(originalDataset));
    setEtag(initialEtag);
  }, [originalDataset, initialEtag]);

  const onDiscard = useCallback(() => {
    setDataset(structuredClone(originalDataset));
    setHasTestCaseChanges(false);
    testCasesActionsRef.current?.clearDirtyAndRefresh();
  }, [originalDataset]);

  const toBatchItem = (tc: TestCase): TestCaseBatchPutItem => ({
    id: tc.id,
    testCaseName: tc.testCaseName,
    data: tc.data,
  });

  const saveDirtyTestCases = useCallback(async (): Promise<boolean> => {
    const dirty = testCasesActionsRef.current?.getDirtyTestCases() ?? [];
    if (dirty.length === 0) return true;
    const res = await batchPutDatasetTestCases(dataset.id, dirty.map(toBatchItem));
    if (!res?.success) {
      showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage, res?.requestId));
      return false;
    }
    return true;
  }, [dataset.id, showNotification]);

  const putDataset = useCallback(
    (currentEtag: string) =>
      updateDataset(
        dataset.id,
        {
          name: dataset.name,
          description: dataset.description,
          testCaseSchema: dataset.testCaseSchema,
        },
        currentEtag,
      ),
    [dataset.description, dataset.id, dataset.name, dataset.testCaseSchema],
  );

  const onSave = useCallback(async () => {
    const datasetDirty = !isEqualSkippingUndefined(originalDataset, dataset);
    let res = datasetDirty ? await putDataset(etag) : null;

    // 412 retry: silently re-fetch latest etag and retry once if the user's edits
    // don't overlap with any server-side changes to the same fields.
    if (res && !res.success && res.status === 412) {
      const fresh = await getDataset(dataset.id, '');
      if (fresh?.success && fresh.response) {
        const remote = fresh.response as Dataset;
        const userEditedFields: Array<keyof Dataset> = ['name', 'description', 'testCaseSchema'];
        const overlap = userEditedFields.some(
          (f) => !isEqual(originalDataset[f], dataset[f]) && !isEqual(originalDataset[f], remote[f]),
        );
        if (!overlap) {
          res = await putDataset(fresh.etag || '');
        } else {
          showNotification(
            getErrorNotification(
              t(DatasetsI18nKey.VersionConflictTitle),
              t(DatasetsI18nKey.VersionConflictMessage),
              res.requestId,
            ),
          );
          return;
        }
      }
    }

    if (res && !res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      return;
    }

    // 202 → schema-changing put spawned a revalidation task; start polling.
    if (res && res.status === 202 && res.response && typeof res.response === 'object') {
      const task = res.response as RevalidationTask;
      setRevalidationTask(task);
      void pollRevalidationTask(dataset.id, task.taskId, {
        onProgress: (t) => setRevalidationTask(t),
      }).promise.then((final) => {
        setRevalidationTask(final);
        router.refresh();
      });
    }

    const tcOk = await saveDirtyTestCases();
    if (!tcOk) return;
    testCasesActionsRef.current?.clearDirtyAndRefresh();
    setHasTestCaseChanges(false);
    showNotification(getSuccessNotification(t(DatasetsI18nKey.UpdateDataset), `${dataset.name} updated`));
    router.refresh();
  }, [dataset, etag, originalDataset, putDataset, router, saveDirtyTestCases, showNotification, t]);

  const onChangeSchema = useCallback((schema: TestCaseSchema[]) => {
    setDataset((d) => ({ ...d, testCaseSchema: schema }));
  }, []);

  const onToggleVisibility = useCallback(() => {
    if (isChangingVisibility) return;
    const next = dataset.visibility === DatasetVisibility.PUBLIC ? DatasetVisibility.PRIVATE : DatasetVisibility.PUBLIC;
    const pendingId = showNotification(
      getPrepareNotification(
        t(DatasetsI18nKey.Visibility),
        next === DatasetVisibility.PUBLIC ? `Making ${dataset.name} public…` : `Making ${dataset.name} private…`,
      ),
    );
    setIsChangingVisibility(true);
    patchDatasetVisibility(dataset.id, { visibility: next })
      .then((res) => {
        removeNotification(pendingId);
        if (res?.success) {
          showNotification(
            getSuccessNotification(
              t(DatasetsI18nKey.Visibility),
              `${dataset.name} is now ${next === DatasetVisibility.PUBLIC ? 'public' : 'private'}`,
            ),
          );
          // Let router.refresh() update originalDataset → useEffect resets local dataset.
          // Avoids momentarily diverging local vs. original state that would flash the Save button.
          router.refresh();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage, res?.requestId));
        }
      })
      .finally(() => setIsChangingVisibility(false));
  }, [
    dataset.id,
    dataset.name,
    dataset.visibility,
    isChangingVisibility,
    removeNotification,
    router,
    showNotification,
    t,
  ]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Datasets}
        entity={dataset}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeDataset}
      >
        <DialNeutralButton
          label={
            dataset.visibility === DatasetVisibility.PUBLIC
              ? t(DatasetsI18nKey.MakePrivate)
              : t(DatasetsI18nKey.MakePublic)
          }
          onClick={onToggleVisibility}
          disabled={isChangingVisibility}
        />
        <RevalidationTaskIndicator task={revalidationTask} />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {activeTab === EntityViewTab.Properties && (
          <PropertiesTabContent entity={dataset} view={ApplicationRoute.Datasets} id={dataset.id}>
            <div className="flex flex-col gap-y-8">
              <DisplayNameControl
                displayName={dataset.name}
                required
                isFullWidth={false}
                onChange={(name) => setDataset((d) => ({ ...d, name: name ?? '' }))}
              />
              <DescriptionControl
                isFullWidth={false}
                entity={dataset}
                onChangeEntity={(d) => setDataset(d as Dataset)}
              />
            </div>
          </PropertiesTabContent>
        )}
        {activeTab === EntityViewTab.Schema && (
          <SchemaManager testCaseSchema={dataset.testCaseSchema} onChangeTestCaseSchema={onChangeSchema} />
        )}
        {activeTab === EntityViewTab.TestCases && (
          <TestCasesList
            datasetId={dataset.id}
            schema={dataset.testCaseSchema}
            fileScopeId={dataset.id}
            fileScopeView={ApplicationRoute.Datasets}
            testCasesActionsRef={testCasesActionsRef}
            onDirtyChange={setHasTestCaseChanges}
          />
        )}
        {activeTab === EntityViewTab.Files && (
          <ApplicationFileManager
            id={dataset.id}
            view={ApplicationRoute.Datasets}
            selectedFilePath={null}
            onChangeSelectedFilePath={() => undefined}
          />
        )}
        {activeTab === EntityViewTab.RevalidationTasks && (
          <div className="text-secondary dial-small-text px-4 py-6">{t(DatasetsI18nKey.RevalidationTasks)}</div>
        )}
      </div>
    </div>
  );
};

export default DatasetView;
