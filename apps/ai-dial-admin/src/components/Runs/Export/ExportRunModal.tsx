'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialNeutralButton, DialPopup, DialPrimaryButton, PopupSize } from '@epam/ai-dial-ui-kit';

import { exportRunPreview } from '@/src/app/[lang]/runs/actions';
import ColumnsAccordion from '@/src/components/Runs/Export/components/ColumnsAccordion';
import PreviewAccordion from '@/src/components/Runs/Export/components/PreviewAccordion';
import { Props } from '@/src/components/Runs/Export/models';
import { ColumnGroupId, groupColumns } from '@/src/components/Runs/Export/utils/group-columns';
import { ButtonsI18nKey, ExportRunI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';

const ExportRunModal: FC<Props> = ({ runId, onClose }) => {
  const t = useI18n();
  const { showNotification, removeNotification } = useNotification();

  const [previewData, setPreviewData] = useState<unknown[][] | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [checkedColumns, setCheckedColumns] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setIsPreviewLoading(true);
    exportRunPreview(runId)
      .then((data) => {
        if (!data) {
          setPreviewError(true);
          return;
        }
        setPreviewData(data);
        const headers = data[0] as string[];
        const groups = groupColumns(headers);
        const defaults = new Set(
          groups
            .flatMap((g) => g.columns)
            .filter((c) => c.defaultChecked)
            .map((c) => c.name),
        );
        setCheckedColumns(defaults);
      })
      .catch(() => setPreviewError(true))
      .finally(() => setIsPreviewLoading(false));
  }, [runId]);

  const groups = useMemo(() => {
    if (!previewData || previewData.length === 0) return [];
    return groupColumns(previewData[0] as string[]);
  }, [previewData]);

  const onToggleColumn = useCallback((columnName: string, checked?: boolean) => {
    setCheckedColumns((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(columnName);
      } else {
        next.delete(columnName);
      }
      return next;
    });
  }, []);

  const onToggleGroup = useCallback(
    (groupId: ColumnGroupId, checked?: boolean) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;
      setCheckedColumns((prev) => {
        const next = new Set(prev);
        for (const col of group.columns) {
          if (checked) {
            next.add(col.name);
          } else {
            next.delete(col.name);
          }
        }
        return next;
      });
    },
    [groups],
  );

  const onExport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    // Close the modal immediately, then run export in background
    onClose();

    const loadingId = showNotification(
      getPrepareNotification(t(ExportRunI18nKey.ExportStarted), t(ExportRunI18nKey.ExportStartedDescription)),
    );

    const allColumns = previewData ? (previewData[0] as string[]) : [];
    const columns = allColumns.filter((c) => checkedColumns.has(c));

    try {
      const res = await fetch('/api/eval/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, computation: 'latest', columns, delimiter: ',' }),
      });

      removeNotification(loadingId);

      if (!res.ok) {
        showNotification(getErrorNotification(t(ExportRunI18nKey.ExportError)));
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]+)\1/);
      const fileName = match?.[2]?.trim() ?? 'run-export.csv';

      downloadFile(blob, fileName);
      showNotification(
        getSuccessNotification(t(ExportRunI18nKey.ExportSuccess), t(ExportRunI18nKey.ExportSuccessDescription)),
      );
    } catch {
      removeNotification(loadingId);
      showNotification(getErrorNotification(t(ExportRunI18nKey.ExportError)));
    }
  }, [checkedColumns, isExporting, onClose, previewData, removeNotification, runId, showNotification, t]);

  return (
    <DialPopup
      onClose={onClose}
      header={`${t(ExportRunI18nKey.ExportRunTitle)} ${runId}`}
      portalId="ExportRunModal"
      open={true}
      size={PopupSize.Lg}
    >
      <div className="flex flex-col h-[80vh]">
        <div className="flex flex-col gap-4 p-6 flex-1 overflow-y-auto">
          <ColumnsAccordion
            groups={groups}
            checkedColumns={checkedColumns}
            isLoading={isPreviewLoading}
            onToggleColumn={onToggleColumn}
            onToggleGroup={onToggleGroup}
          />
          <PreviewAccordion
            previewData={previewData}
            checkedColumns={checkedColumns}
            isLoading={isPreviewLoading}
            error={previewError}
          />
        </div>
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4 border-t border-primary flex-shrink-0">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton label={t(ButtonsI18nKey.ExportCsv)} onClick={onExport} disabled={isExporting} />
        </div>
      </div>
    </DialPopup>
  );
};

export default ExportRunModal;
