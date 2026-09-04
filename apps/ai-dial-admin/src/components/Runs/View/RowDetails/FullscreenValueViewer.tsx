'use client';

import { FC, useMemo } from 'react';

import { DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';

interface Props {
  isOpen: boolean;
  fieldLabel: string;
  value: string;
  onClose: () => void;
}

const FullscreenValueViewer: FC<Props> = ({ isOpen, fieldLabel, value, onClose }) => {
  const displayText = useMemo(() => {
    const formatted = formatFieldValue(value);
    const trimmed = formatted.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return formatted;
      }
    }
    return formatted;
  }, [value]);

  return (
    <DialPopup
      onClose={onClose}
      header={fieldLabel}
      portalId="FullscreenValueViewer"
      open={isOpen}
      size={PopupSize.Lg}
      className="h-[80vh]"
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-auto px-6 py-4">
        <pre className="text-primary dial-small-text whitespace-pre-wrap break-words font-mono">{displayText}</pre>
      </div>
    </DialPopup>
  );
};

export default FullscreenValueViewer;
