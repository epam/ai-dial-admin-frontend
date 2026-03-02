'use client';

import { DialLoader, DialLoadFileArea, DialPopup, DialSteps, PopupSize, Step, StepStatus } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useMemo, useState } from 'react';

import { importTestCasePreview } from '@/src/app/[lang]/test-suites/actions';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';
import GridView from '@/src/components/Grid/GridView/GridView';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import ImportOptionsStep from './ImportOptionsStep';
import { ImportPreview } from './models';
import SelectedFile from './SelectedFile';
import { getGridDataFromImportPreview } from './utils';

const STEP_FILE = 'file';
const STEP_OPTIONS = 'options';

interface Props {
  selectedTestSuiteId: string;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => void;
}

const ImportFileModal: FC<Props> = ({ selectedTestSuiteId, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [currentStepId, setCurrentStepId] = useState(STEP_FILE);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<object[] | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [importMode, setImportMode] = useState(TestCaseImportMode.OVERRIDE);
  const [conflictStrategy, setConflictStrategy] = useState(TestCaseConflictStrategy.FAIL);

  const steps: Step[] = useMemo(
    () => [
      {
        id: STEP_FILE,
        name: t(TestSuitesI18nKey.ImportStepFile),
        status: testCases && !isLoading ? StepStatus.VALID : undefined,
      },
      { id: STEP_OPTIONS, name: t(TestSuitesI18nKey.ImportStepOptions), status: StepStatus.VALID },
    ],
    [isLoading, t, testCases],
  );

  const currentStep = useMemo(() => steps.find((s) => s.id === currentStepId), [steps, currentStepId]);

  const onChangeFile = (files: File[]) => {
    const body = new FormData();

    const file = files[0] as File;
    body.append('file', file);
    setSelectedFile(file);

    setIsLoading(true);

    importTestCasePreview(selectedTestSuiteId, body).then((res) => {
      setIsLoading(false);
      const testCasesData = (res?.response || []) as ImportPreview;
      const { colDefs, rowData } = getGridDataFromImportPreview(testCasesData);
      setTestCases(rowData);
      setColumnDefs(colDefs);
    });
  };

  const onImportApply = useCallback(() => {
    if (selectedFile) {
      onApply(selectedFile, importMode, conflictStrategy);
    }
    onClose();
  }, [selectedFile, importMode, conflictStrategy, onApply, onClose]);

  return (
    <DialPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(TestSuitesI18nKey.ImportFromPC)}
      portalId="ImportFileModal"
      size={PopupSize.Lg}
    >
      <div className="flex flex-col py-4 px-6 gap-y-6 h-[600px]">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStepId} />
        <div className="flex-1 min-h-0 overflow-auto">
          {currentStepId === STEP_FILE && (
            <>
              {!testCases && !isLoading && (
                <DialLoadFileArea
                  acceptTypes="text/csv"
                  emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
                  emptyTextSecondLine={t(BasicI18nKey.Or)}
                  emptyButtonLabel={t(ButtonsI18nKey.Browse)}
                  onChange={onChangeFile}
                  multiple={false}
                />
              )}
              {isLoading && <DialLoader size={44} />}
              {testCases && !isLoading && (
                <div className="flex flex-col h-full">
                  <SelectedFile file={selectedFile} onChangeFile={onChangeFile} />
                  <span className="dial-small-sime-text mb-1 mt-4 text-secondary">{t(TestSuitesI18nKey.Preview)}:</span>
                  <div className="flex-1 min-h-0">
                    <GridView columnDefs={columnDefs} rowData={testCases || []} />
                  </div>
                </div>
              )}
            </>
          )}
          {currentStepId === STEP_OPTIONS && (
            <ImportOptionsStep
              importMode={importMode}
              conflictStrategy={conflictStrategy}
              onImportModeChange={setImportMode}
              onConflictStrategyChange={setConflictStrategy}
            />
          )}
        </div>
      </div>

      <StepperModalButtons
        steps={steps}
        currentStep={currentStep}
        onChangeStep={setCurrentStepId}
        onFinishClick={onImportApply}
        onClose={onClose}
        finishButtonLabel={t(ButtonsI18nKey.Import)}
      />
    </DialPopup>
  );
};

export default ImportFileModal;
