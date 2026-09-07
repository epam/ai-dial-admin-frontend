'use client';

import { FC, useState } from 'react';

import { ICellRendererParams } from 'ag-grid-community';
import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconMaximize } from '@tabler/icons-react';

import ResultValueDialog from '@/src/components/Analytics/QueryBuilder/Result/ResultValueDialog';
import { isFullValueNeeded, previewOf } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const ICON_SIZE = 16;

const ResultValueCell: FC<ICellRendererParams> = ({ value, valueFormatted, colDef }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const text = valueFormatted ?? '';
  const column = colDef?.headerName ?? colDef?.field ?? '';

  if (!isFullValueNeeded(text)) return <>{text}</>;

  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 flex-1 truncate">{previewOf(text)}</span>
      <DialGhostIconButton
        size={ElementSize.Small}
        aria-label={`${t(QueryBuilderI18nKey.ViewFullValue)} ${column}`}
        icon={<IconMaximize aria-hidden size={ICON_SIZE} />}
        onClick={() => setIsOpen(true)}
      />
      {isOpen && <ResultValueDialog column={column} value={value} onClose={() => setIsOpen(false)} />}
    </span>
  );
};

export default ResultValueCell;
