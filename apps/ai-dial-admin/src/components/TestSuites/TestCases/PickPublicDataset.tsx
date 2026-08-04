'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialNotification,
  DialPopup,
  DialSteps,
  NotificationVariant,
  PopupSize,
  StepStatus,
} from '@epam/ai-dial-ui-kit';

import { getDataset, getDatasets, getTestCases } from '@/src/app/[lang]/datasets/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import { getDatasetTestCaseColumns } from '@/src/components/Datasets/utils/columns';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import ListEntities from '@/src/components/ListView/List';
import { ButtonsI18nKey, EntitiesI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DATASETS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { OnCellChange } from '@/src/models/grid-cell';
import { expandTestCasesToRows } from '@/src/utils/evaluation/test-case-grouping';
import { ATTACH_DATASET_STEPS, AttachDatasetTab } from './pick-dataset-constants';

const noopCellChange: OnCellChange = () => {};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (datasetId: string) => void;
  showWarning?: boolean;
}

const PickPublicDataset: FC<Props> = ({ isOpen, onClose, onConfirm, showWarning }) => {
  const t = useI18n();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [currentStepId, setCurrentStep] = useState<string>(AttachDatasetTab.SelectDataset);
  const [testCasesData, setTestCasesData] = useState<DatasetTestCase[]>([]);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);

  const steps = useMemo(
    () =>
      ATTACH_DATASET_STEPS(t).map((step) =>
        step.id === AttachDatasetTab.SelectDataset
          ? { ...step, status: selectedDataset ? StepStatus.VALID : undefined }
          : step,
      ),
    [t, selectedDataset],
  );

  const currentStep = useMemo(() => steps.find((s) => s.id === currentStepId), [steps, currentStepId]);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(AttachDatasetTab.SelectDataset);
    setSelectedDataset(null);
    setTestCasesData([]);
    setPreviewDataset(null);
    setIsPreviewLoaded(false);
  }, [isOpen]);

  useEffect(() => {
    setIsPreviewLoaded(false);
    setTestCasesData([]);
    setPreviewDataset(null);
  }, [selectedDataset?.id]);

  useEffect(() => {
    setIsLoadingDatasets(true);
    getDatasets(0, 1000, [], [])
      .then((res) => setDatasets(res?.content ?? []))
      .finally(() => setIsLoadingDatasets(false));
  }, []);

  const rawRows = useMemo(() => expandTestCasesToRows(testCasesData), [testCasesData]);

  const { rowData, onToggleExpand, getRowId, getRowHeight, onFilterChanged } = useTurnGroupProjection({ rawRows });

  const previewColumns = useMemo(
    () =>
      previewDataset
        ? getDatasetTestCaseColumns({
            dataset: previewDataset,
            onCellChange: noopCellChange,
            onToggleExpand,
            isReadOnly: true,
          })
        : [],
    [previewDataset, onToggleExpand],
  );

  const previewGridOptions = useMemo(
    () => ({ suppressClickEdit: true, getRowId, getRowHeight, onFilterChanged }),
    [getRowId, getRowHeight, onFilterChanged],
  );

  const onNextStep = useCallback(async () => {
    if (!selectedDataset?.id) return;
    setIsLoadingPreview(true);

    const [testCasesRes, datasetRes] = await Promise.all([
      getTestCases(selectedDataset.id, 0, 1000, [], []),
      getDataset(selectedDataset.id, ''),
    ]);

    setTestCasesData(testCasesRes?.content ?? []);
    setPreviewDataset((datasetRes?.response as Dataset) ?? null);
    setIsLoadingPreview(false);
    setIsPreviewLoaded(true);

    const stepIndex = steps.findIndex((s) => s.id === currentStepId);
    setCurrentStep(steps[stepIndex + 1]?.id as string);
  }, [selectedDataset, steps, currentStepId]);

  const onChangeStep = useCallback(
    (id: string) => {
      if (id === AttachDatasetTab.PreviewTestCases && !isPreviewLoaded) return;
      setCurrentStep(id);
    },
    [isPreviewLoaded],
  );

  const onConfirmClick = useCallback(() => {
    if (selectedDataset?.id) onConfirm(selectedDataset.id);
  }, [selectedDataset, onConfirm]);

  return (
    <DialPopup
      onClose={onClose}
      header={t(TestSuitesI18nKey.AttachDataset)}
      portalId="PickPublicDatasetModal"
      open={isOpen}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 overflow-auto gap-y-6 h-[600px]">
        {showWarning && (
          <DialNotification variant={NotificationVariant.Warning} message={t(TestSuitesI18nKey.AttachDatasetWarning)} />
        )}
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={onChangeStep} />
        <div className="flex-1 min-h-0">
          {currentStepId === AttachDatasetTab.SelectDataset && (
            <div className="flex flex-col h-full gap-y-3">
              <p className="dial-small text-secondary">{t(TestSuitesI18nKey.SelectDatasetDescription)}</p>
              <div className="flex-1 min-h-0">
                <RadioSelectGrid
                  data={datasets}
                  columnDefs={DATASETS_COLUMN}
                  idField="id"
                  selectedId={selectedDataset?.id}
                  emptyTitle={t(EntitiesI18nKey.NoDatasets)}
                  isLoading={isLoadingDatasets}
                  onSelect={setSelectedDataset}
                />
              </div>
            </div>
          )}

          {currentStepId === AttachDatasetTab.PreviewTestCases && (
            <ListEntities rowData={rowData} columnDefs={previewColumns} additionalGridOptions={previewGridOptions} />
          )}
        </div>
      </div>

      <StepperModalButtons
        onClose={onClose}
        onFinishClick={onConfirmClick}
        onChangeStep={setCurrentStep}
        steps={steps}
        currentStep={currentStep}
        finishButtonLabel={t(ButtonsI18nKey.Confirm)}
        onNextStep={onNextStep}
        isLoading={isLoadingPreview}
      />
    </DialPopup>
  );
};

export default PickPublicDataset;
