'use client';

import { DialFormPopup, DialLoader, DialLoadFileArea, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { FC, useCallback, useState } from 'react';

import { importTestCasePreview } from '@/src/app/[lang]/test-suites/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCase } from '@/src/models/evaluation/test-suite';
import SelectedFile from './SelectedFile';
import { ImportPreview } from './models';
import { getGridDataFromImportPreview } from './utils';

interface Props {
  selectedTestSuiteId: string;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (file: File) => void;
}

const ImportFileModal: FC<Props> = ({ selectedTestSuiteId, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<object[] | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

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
      onApply(selectedFile);
    }
    onClose();
  }, [selectedFile, onApply, onClose]);

  return (
    <DialFormPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(TestSuitesI18nKey.ImportFromPC)}
      portalId="ImportFileModal"
      size={PopupSize.Lg}
      onSubmit={onImportApply}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 flex-col h-[800px]">
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
      </div>
    </DialFormPopup>
  );
};

export default ImportFileModal;
