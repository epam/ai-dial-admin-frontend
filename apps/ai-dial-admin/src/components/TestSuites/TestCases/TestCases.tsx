'use client';

import { FC, RefObject, useCallback, useEffect, useMemo, useState } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { getDataset, updateDataset } from '@/src/app/[lang]/datasets/actions';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getErrorNotification } from '@/src/utils/notification';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { DatasetVisibility } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import TestCasesList, { TestCasesActions } from './TestCasesList';
import TemplateVariables from './TemplateVariables';

interface Props {
  selectedTestSuite: TestSuite;
  originalTestSuite?: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  isSkipRefresh?: boolean;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
}

const TestCases: FC<Props> = ({
  selectedTestSuite,
  originalTestSuite,
  onChange,
  isSkipRefresh,
  testCasesActionsRef,
  onDirtyChange,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [boundDataset, setBoundDataset] = useState<Dataset | null>(null);
  const [datasetEtag, setDatasetEtag] = useState<string | undefined>(undefined);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);

  const datasetId = selectedTestSuite.datasetId ?? null;

  useEffect(() => {
    let cancelled = false;
    if (!datasetId) {
      setBoundDataset(null);
      setDatasetEtag(undefined);
      return;
    }
    setIsLoadingDataset(true);
    getDataset(datasetId, '').then((res) => {
      if (cancelled) return;
      setIsLoadingDataset(false);
      if (res?.success && res.response) {
        setBoundDataset(res.response as Dataset);
        setDatasetEtag(res.etag);
      } else {
        setBoundDataset(null);
        setDatasetEtag(undefined);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [datasetId]);

  const schema: TestCaseSchema[] = useMemo(() => boundDataset?.testCaseSchema ?? [], [boundDataset]);

  const isNotSaved = useMemo(() => {
    return !isEqual(selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate);
  }, [selectedTestSuite.requestTemplate, originalTestSuite?.requestTemplate]);

  const onChangeSchema = useCallback(
    (nextSchema: TestCaseSchema[]) => {
      if (!boundDataset) return;
      // Optimistic local update so the grid re-renders immediately.
      const next = { ...boundDataset, testCaseSchema: nextSchema };
      setBoundDataset(next);
      const req = {
        name: boundDataset.name,
        description: boundDataset.description,
        testCaseSchema: nextSchema,
      };
      updateDataset(boundDataset.id, req, datasetEtag || '').then((res) => {
        if (!res?.success) {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
          // Revert optimistic update on failure.
          setBoundDataset(boundDataset);
        } else {
          setDatasetEtag(res.etag);
        }
      });
      onDirtyChange?.(true);
    },
    [boundDataset, datasetEtag, onDirtyChange, showNotification],
  );

  if (isLoadingDataset) {
    return null;
  }

  if (!datasetId || !boundDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-y-4">
        <DialAlert variant={AlertVariant.Info} message={t(TestSuitesI18nKey.NoTestCases)} />
        <span className="dial-small-text">
          Bind this suite to a Dataset to manage test cases. Use the Properties tab to pick or create one.
        </span>
      </div>
    );
  }

  const readOnly = boundDataset.visibility === DatasetVisibility.PUBLIC;
  const disabledIds = new Set(selectedTestSuite.disabledTestCaseIds ?? []);

  const onToggleDisabled = (id: string, nextDisabled: boolean) => {
    const current = new Set(selectedTestSuite.disabledTestCaseIds ?? []);
    if (nextDisabled) current.add(id);
    else current.delete(id);
    onChange({ ...selectedTestSuite, disabledTestCaseIds: Array.from(current) }, true);
  };

  return (
    <div className="h-full flex flex-col gap-y-6">
      <TemplateVariables
        selectedTestSuite={selectedTestSuite}
        testCaseSchema={schema}
        onChange={onChange}
        isSkipRefresh={isSkipRefresh}
      />
      <TestCasesList
        datasetId={boundDataset.id}
        schema={schema}
        fileScopeId={boundDataset.id}
        fileScopeView={ApplicationRoute.Datasets}
        readOnly={readOnly}
        onChangeSchema={readOnly ? undefined : onChangeSchema}
        testCasesActionsRef={testCasesActionsRef}
        onDirtyChange={onDirtyChange}
        disabledIds={disabledIds}
        onToggleDisabled={onToggleDisabled}
      />
      {isNotSaved && <DialAlert variant={AlertVariant.Info} message={t(TestSuitesI18nKey.Warning)} />}
    </div>
  );
};

export default TestCases;
