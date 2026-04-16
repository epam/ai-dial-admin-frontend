'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { IconExternalLink } from '@tabler/icons-react';
import { FC } from 'react';

import { isValidHttpUrl } from '@/src/utils/validation/url-error';

const ExternalUrlCellRenderer: FC<ICellRendererParams> = ({ value }) => {
  if (!value) {
    return null;
  }

  const text = String(value);

  if (!isValidHttpUrl(text)) {
    return <span>{text}</span>;
  }

  return (
    <a
      href={text}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent-primary hover:underline inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {text}
      <IconExternalLink size={14} />
    </a>
  );
};

export default ExternalUrlCellRenderer;
