'use client';

import { FC, useCallback } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialFileIcon } from '@epam/ai-dial-ui-kit';

import { EnvVarRowData } from '@/src/models/activity-audit';
import { VALUE_TYPE, MOUNT_TYPE } from '@/src/types/deployments/variables';
import { downloadFile } from '@/src/utils/download';
import { getNameExtensionFromFile } from '@/src/utils/files/get-extension';

const SECRET_PLACEHOLDER = '••••••';

const EnvVarValueCellRenderer: FC<ICellRendererParams> = (props) => {
  const data = (props.data ?? {}) as EnvVarRowData;
  const mountType = data.mountType;
  const valueType = data.valueType;
  const value = (props.value ?? '') as string;
  const onDownload = useCallback(() => {
    if (!data.fileContent || !value) return;
    try {
      const bytes = Uint8Array.from(atob(data.fileContent), (c) => c.charCodeAt(0));
      downloadFile(new Blob([bytes]), value);
    } catch (err) {
      console.warn('Failed to decode env-var file content for download', err);
    }
  }, [data.fileContent, value]);

  const isSecure = mountType === MOUNT_TYPE.SECURE_CONTENT || mountType === MOUNT_TYPE.SECURE_FILE;

  if (valueType === VALUE_TYPE.FILE && value) {
    const { extension } = getNameExtensionFromFile(value);
    const isDownloadable = !!data.fileContent;
    return (
      <div className="h-full w-full flex items-center gap-x-2 min-w-0 text-accent-primary">
        <DialFileIcon extension={extension} />
        <span
          className={`truncate ${isDownloadable ? 'underline cursor-pointer' : ''}`}
          onClick={isDownloadable ? onDownload : undefined}
        >
          {value}
        </span>
      </div>
    );
  }

  if (isSecure) {
    return (
      <span className="truncate text-primary" title="Secret values are not stored in audit history">
        {SECRET_PLACEHOLDER}
      </span>
    );
  }

  return <span className="truncate">{value}</span>;
};

export default EnvVarValueCellRenderer;
