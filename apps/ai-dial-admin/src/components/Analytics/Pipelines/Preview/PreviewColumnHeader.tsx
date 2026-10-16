'use client';

import { FC } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IHeaderParams } from 'ag-grid-community';

import IdentityTag from '@/src/components/Analytics/Common/IdentityTag';
import { getRoleLabelKey, getTypeLine } from '@/src/components/Analytics/Pipelines/Preview/utils/preview-columns';
import { PipelinePreviewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PreviewColumn } from '@/src/models/analytics/pipeline-preview';

interface Props extends IHeaderParams {
  previewColumn: PreviewColumn;
}

/** A column's name over its role, its sampled type with the type it is written as, and its widest value. */
const PreviewColumnHeader: FC<Props> = ({ previewColumn }) => {
  const t = useI18n();
  const roleKey = getRoleLabelKey(previewColumn.role);

  return (
    <div className="flex h-full min-w-0 flex-col justify-center gap-0.5 py-2">
      <DialEllipsisTooltip
        text={previewColumn.name}
        className="min-w-0 font-mono dial-small-semi text-primary"
        contentClassName="truncate"
      />
      <div className="flex min-w-0 items-center gap-1.5 text-secondary dial-tiny-text">
        {roleKey && <IdentityTag label={t(roleKey)} />}
        <span className="truncate">{getTypeLine(previewColumn)}</span>
        {previewColumn.max_bytes != null && (
          <span className="shrink-0">
            {t(PipelinePreviewI18nKey.MaxBytes, { size: previewColumn.max_bytes.toLocaleString('en-US') })}
          </span>
        )}
      </div>
    </div>
  );
};

export default PreviewColumnHeader;
