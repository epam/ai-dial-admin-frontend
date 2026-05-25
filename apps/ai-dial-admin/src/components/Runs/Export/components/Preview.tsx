'use client';

import { FC, useMemo } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import AgGridWrapper from '@/src/components/Grid/AgGridWrapper';
import { ExportRunI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  previewData: unknown[][] | null;
  checkedColumns: Set<string>;
  isLoading: boolean;
  error: boolean;
}

const Preview: FC<Props> = ({ previewData, checkedColumns, isLoading, error }) => {
  const t = useI18n();

  const columnDefs = useMemo<ColDef[]>(() => {
    if (!previewData || previewData.length === 0) return [];
    const headers = previewData[0] as string[];
    return headers.filter((h) => checkedColumns.has(h)).map((h) => ({ field: h, headerName: h, width: 288 }));
  }, [previewData, checkedColumns]);

  const rowData = useMemo<Record<string, unknown>[]>(() => {
    if (!previewData || previewData.length <= 1) return [];
    const headers = previewData[0] as string[];
    return (previewData.slice(1) as unknown[][]).map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
  }, [previewData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <DialLoader size={24} className="text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-error">{t(ExportRunI18nKey.PreviewLoadError)}</div>
    );
  }

  return (
    <div className="flex flex-col gap-2 flex-1 min-h-0">
      <p className="text-secondary text-sm flex-shrink-0">{t(ExportRunI18nKey.PreviewDescription)}</p>
      <div className="flex-1 min-h-0">
        <AgGridWrapper columnDefs={columnDefs} rowData={rowData} isLiveData={true} />
      </div>
    </div>
  );
};

export default Preview;
