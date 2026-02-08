'use client';

import { DialFormPopup, DialLoadFileArea, PopupSize } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { FC, useState } from 'react';

import { importTestCasePreview } from '@/src/app/[lang]/test-suites/actions';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCase } from '@/src/models/evaluation/test-suite';
import { getTestCaseColumns } from '../../utils/columns';
import Grid from '@/src/components/Grid/Grid';
import SelectedFile from './SelectedFile';

interface Props {
  selectedTestSuiteId: string;
  isModalOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

const ImportFileModal: FC<Props> = ({ selectedTestSuiteId, isModalOpen, onClose, onApply }) => {
  const t = useI18n();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);

  const onChangeFile = (files: File[]) => {
    const body = new FormData();

    body.append('file', files[0] as File);
    setSelectedFile(files[0] as File);

    importTestCasePreview(selectedTestSuiteId, body).then((res) => {
      const testCasesData = (res?.response.content || []) as TestCase[];
      setTestCases(testCasesData);
      setColumnDefs(getTestCaseColumns(testCasesData));
    });
  };

  return (
    <DialFormPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(TestSuitesI18nKey.ImportFromPC)}
      portalId="ImportFileModal"
      size={PopupSize.Lg}
      onSubmit={onApply}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Confirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 flex-col h-[800px]">
        {!testCases && (
          <DialLoadFileArea
            elementId="ss"
            fieldTitle="dds"
            acceptTypes="/"
            emptyTextFirstLine={t(ImportI18nKey.DropAnyFile)}
            emptyTextSecondLine={t(BasicI18nKey.Or)}
            emptyButtonLabel={t(ButtonsI18nKey.Browse)}
            onChange={onChangeFile}
            multiple={false}
          />
        )}
        {testCases && (
          <div className="flex flex-col">
            <SelectedFile file={selectedFile} onChangeFile={onChangeFile} />
            <span className="dial-small font-semibold mb-2">{t(TestSuitesI18nKey.Preview)}</span>
            <div className="flex-1 min-h-0">
              <Grid columnDefs={columnDefs} rowData={testCases || []} />
            </div>
          </div>
        )}
      </div>
    </DialFormPopup>
  );
};

export default ImportFileModal;
