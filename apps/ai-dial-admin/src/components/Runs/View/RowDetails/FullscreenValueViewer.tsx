'use client';

import { FC, useMemo } from 'react';

import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  fieldLabel: string;
  value: string;
  onClose: () => void;
}

const FullscreenValueViewer: FC<Props> = ({ isOpen, fieldLabel, value, onClose }) => {
  const t = useI18n();
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
    <Popup
      onClose={onClose}
      header={fieldLabel}
      headerDivider
      footer={
        <div className="flex items-center justify-center px-4 py-2 shrink-0">
          <CopyButton buttonLabel={t(ButtonsI18nKey.Copy)} value={displayText} valueLabel={fieldLabel} />
        </div>
      }
      portalId="FullscreenValueViewer"
      open={isOpen}
      size={PopupSize.Lg}
      className="md:h-[80vh]"
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-auto px-6 py-4">
        <pre className="text-primary dial-code-text whitespace-pre-wrap break-words">{displayText}</pre>
      </div>
    </Popup>
  );
};

export default FullscreenValueViewer;
