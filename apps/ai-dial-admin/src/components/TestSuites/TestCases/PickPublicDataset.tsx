'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialPopup, DialSteps, PopupSize, StepStatus } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { getDataset, getDatasets, getTestCases } from '@/src/app/[lang]/datasets/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import RadioSelectGrid from '@/src/components/Grid/GridView/RadioSelectGrid';
import ListEntities from '@/src/components/ListView/List';
import { ButtonsI18nKey, EntitiesI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DATASETS_COLUMN, TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ATTACH_DATASET_STEPS, AttachDatasetTab } from './pick-dataset-constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (datasetId: string) => void;
}

const PickPublicDataset: FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const t = useI18n();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [currentStepId, setCurrentStep] = useState<string>(AttachDatasetTab.SelectDataset);
  const [testCasesData, setTestCasesData] = useState<Record<string, unknown>[]>([]);
  const [schema, setSchema] = useState<TestCaseSchema[]>([]);
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
    setSchema([]);
    setIsPreviewLoaded(false);
  }, [isOpen]);

  useEffect(() => {
    setIsPreviewLoaded(false);
    setTestCasesData([]);
    setSchema([]);
  }, [selectedDataset?.id]);

  useEffect(() => {
    setIsLoadingDatasets(true);
    getDatasets(0, 1000, [], [])
      .then((res) => setDatasets(res?.content ?? []))
      .finally(() => setIsLoadingDatasets(false));
  }, []);

  const previewColumns = useMemo<ColDef[]>(() => {
    const schemaColumns: ColDef[] = schema.map((param) => ({
      field: param.name,
      headerName: param.name,
      valueGetter: (p) => p.data?.data?.[param.name] ?? p.data?.[param.name] ?? '',
    }));
    return [...TEST_CASES_COLUMN, ...schemaColumns];
  }, [schema]);

  const onNextStep = useCallback(async () => {
    if (!selectedDataset?.id) return;
    setIsLoadingPreview(true);

    const [testCasesRes, datasetRes] = await Promise.all([
      getTestCases(selectedDataset.id, 0, 1000, [], []),
      getDataset(selectedDataset.id, ''),
    ]);

    const rawData = testCasesRes?.content?.length ? (testCasesRes.content as Record<string, unknown>[]) : [];
    setTestCasesData(rawData);
    setSchema((datasetRes?.response as Dataset)?.testCaseSchema ?? []);
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
            <ListEntities
              rowData={testCasesData}
              columnDefs={previewColumns}
              additionalGridOptions={{ suppressClickEdit: true }}
            />
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
