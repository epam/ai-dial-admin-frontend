'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import {
  getDatasetByName,
  removeDataset,
  transitionVisibility,
  updateDataset,
  updateTestCases,
} from '@/src/app/[lang]/datasets/actions';
import { DatasetTestCasesActions } from '@/src/components/Datasets/TestCases/TestCasesList';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { DatasetsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility, DatasetVisibilityTransition } from '@/src/models/evaluation/dataset';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getDatasetTabs } from '@/src/utils/tabs/utils';
import DatasetTabsContent from './TabsContent';

interface Props {
  originalDataset: Dataset;
  etag: string;
}

const DatasetView: FC<Props> = ({ originalDataset, etag: initialEtag }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification, removeNotification } = useNotification();

  const testCasesActionsRef = useRef<DatasetTestCasesActions | null>(null);
  const tabs = getDatasetTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedDataset, setSelectedDataset] = useState(structuredClone(originalDataset));
  const [isChanged, setIsChanged] = useState(false);
  const [hasTestCaseChanges, setHasTestCaseChanges] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);
  const [etag, setEtag] = useState(initialEtag);
  const [isMakePublicOpen, setIsMakePublicOpen] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [nameExistsError, setNameExistsError] = useState<string>();

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => {
        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalDataset, selectedDataset) || hasTestCaseChanges);
    setNameExistsError(undefined);
  }, [originalDataset, selectedDataset, hasTestCaseChanges]);

  useEffect(() => {
    setSelectedDataset(structuredClone(originalDataset));
  }, [originalDataset]);

  useEffect(() => {
    setEtag(initialEtag);
  }, [initialEtag]);

  const onDiscard = useCallback(() => {
    setSelectedDataset(structuredClone(originalDataset));
    setHasTestCaseChanges(false);
    setIsSkipRefresh(false);
    setDiscardKey((prev) => prev + 1);
    testCasesActionsRef.current?.clearDirtyAndRefresh();
  }, [originalDataset]);

  const onSave = useCallback(() => {
    let prepareNotificationId: string | undefined;

    const dismissPrepareNotification = () => {
      if (prepareNotificationId) {
        removeNotification(prepareNotificationId);
        prepareNotificationId = undefined;
      }
    };

    const handleError = (header: string | undefined, message: string | undefined, requestId?: string) => {
      dismissPrepareNotification();
      showNotification(getErrorNotification(header, message, requestId));
      router.refresh();
    };

    const showSuccessAndRefresh = () => {
      dismissPrepareNotification();
      showNotification(
        getSuccessNotification(
          getUpdateNotificationTitle(ApplicationRoute.Datasets, t),
          getUpdateNotificationDescription(ApplicationRoute.Datasets, selectedDataset.id, t),
        ),
      );
      router.refresh();
    };

    const performUpdate = () => {
      updateDataset(selectedDataset, etag).then((datasetRes) => {
        if (!datasetRes.success) {
          handleError(datasetRes.errorHeader, datasetRes.errorMessage, datasetRes.requestId);
          return;
        }

        if (datasetRes.etag) {
          setEtag(datasetRes.etag);
        }

        const schemaChanged =
          JSON.stringify(selectedDataset.testCaseSchema) !== JSON.stringify(originalDataset.testCaseSchema);

        if (schemaChanged) {
          prepareNotificationId = showNotification(getPrepareNotification(t(DatasetsI18nKey.RevalidatingTestCases)));
        }

        const dirtyTestCases = testCasesActionsRef.current?.getDirtyTestCases() ?? [];

        if (dirtyTestCases.length > 0 && selectedDataset.id) {
          updateTestCases(selectedDataset.id, dirtyTestCases).then((testCasesRes) => {
            if (!testCasesRes.success) {
              handleError(testCasesRes.errorHeader, testCasesRes.errorMessage, testCasesRes.requestId);
              return;
            }
            testCasesActionsRef.current?.clearDirtyAndRefresh();
            setHasTestCaseChanges(false);
            showSuccessAndRefresh();
          });
        } else {
          testCasesActionsRef.current?.clearDirtyAndRefresh();
          setHasTestCaseChanges(false);
          showSuccessAndRefresh();
        }
      });
    };

    const isNameUnchanged = selectedDataset.name === originalDataset.name;

    if (isNameUnchanged) {
      performUpdate();
      return;
    }

    getDatasetByName(selectedDataset.name!).then((res) => {
      if (res && res.content?.length > 0) {
        setNameExistsError(t(ErrorI18nKey.DisplayNameExists));
      } else {
        performUpdate();
      }
    });
  }, [selectedDataset, etag, originalDataset, showNotification, removeNotification, t, router]);

  const onChangeDataset = useCallback((dataset: Dataset, skipRefresh = false) => {
    setSelectedDataset(dataset);
    setIsSkipRefresh(skipRefresh);
  }, []);

  const isPublic = selectedDataset.visibility === DatasetVisibility.PUBLIC;

  const onTransitionVisibility = useCallback(
    (targetVisibility: DatasetVisibility) => {
      const body: DatasetVisibilityTransition = { visibility: targetVisibility };
      transitionVisibility(selectedDataset.id as string, body).then((res) => {
        if (res.success) {
          showNotification(getSuccessNotification(t(DatasetsI18nKey.MakePublicSuccess)));
          router.refresh();
        } else {
          showNotification(getErrorNotification(t(DatasetsI18nKey.MakePublicFailed), res.errorMessage, res.requestId));
        }
      });
      setIsMakePublicOpen(false);
    },
    [selectedDataset.id, showNotification, t, router],
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <SimpleEntityHeader
          view={ApplicationRoute.Datasets}
          entity={selectedDataset}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          tabs={tabs}
          jsonConfiguration={jsonConfiguration}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
          onRemove={removeDataset}
        >
          {!isPublic && (
            <DialNeutralButton label={t(DatasetsI18nKey.MakePublic)} onClick={() => setIsMakePublicOpen(true)} />
          )}
        </SimpleEntityHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {isEditorEnabled ? (
            <EntityJsonEditor
              key={discardKey}
              entity={selectedDataset}
              setSelectedEntity={setSelectedDataset}
              setIsChanged={setIsChanged}
            />
          ) : (
            <DatasetTabsContent
              key={discardKey}
              testCasesActionsRef={testCasesActionsRef}
              onTestCaseDirtyChange={setHasTestCaseChanges}
              isSkipRefresh={isSkipRefresh}
              activeTab={activeTab}
              selectedDataset={selectedDataset}
              onChange={onChangeDataset}
              nameExistsError={nameExistsError}
            />
          )}
        </div>
      </div>

      {isMakePublicOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isMakePublicOpen}
            header={t(DatasetsI18nKey.MakePublicConfirmTitle)}
            description={t(DatasetsI18nKey.MakePublicConfirmDescription)}
            onConfirm={() => onTransitionVisibility(DatasetVisibility.PUBLIC)}
            onClose={() => setIsMakePublicOpen(false)}
            confirmLabel={t(DatasetsI18nKey.MakePublic)}
          />,
          document.body,
        )}
    </>
  );
};

export default DatasetView;
