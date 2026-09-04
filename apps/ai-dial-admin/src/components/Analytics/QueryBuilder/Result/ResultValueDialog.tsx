'use client';

import { FC, useMemo } from 'react';

import { DialNeutralButton, DialPopup, DialPrimaryButton, PopupSize } from '@epam/ai-dial-ui-kit';
import { Editor } from '@monaco-editor/react';
import { IconCopy } from '@tabler/icons-react';

import { EDITOR_THEMES_CONFIG } from '@/src/constants/editor';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { BasicI18nKey, ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { EDITOR_THEMES } from '@/src/types/editor';
import { beautifyValue } from '@/src/utils/evaluation/detail-panel';
import { getCopyToClipboardNotification } from '@/src/utils/notification';

interface Props {
  column: string;
  value: unknown;
  onClose: () => void;
}

// Monaco is used directly rather than through JsonEditorBase, which installs a JSON schema requiring an
// object at the root — an array-valued column would read as invalid in a viewer that cannot be edited.
const EDITOR_OPTIONS = {
  readOnly: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on' as const,
  folding: true,
  renderLineHighlight: 'none' as const,
  overviewRulerLanes: 0,
};

const isJsonText = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

// Mounted only while open, so the value is formatted when it is asked for rather than on every render
// of a cell the reader is scrolling past.
const ResultValueDialog: FC<Props> = ({ column, value, onClose }) => {
  const t = useI18n();
  const { currentTheme } = useTheme();
  const { showNotification } = useNotification();

  const text = useMemo(() => beautifyValue(value), [value]);
  const language = useMemo(() => (isJsonText(text) ? 'json' : 'plaintext'), [text]);

  // Copying is this dialog's primary action, and the shared CopyButton renders a neutral one, so the
  // clipboard write and its confirmation are done here rather than by giving that control a variant no
  // other caller needs.
  const onCopyValue = () => {
    navigator.clipboard.writeText(text);
    showNotification(
      getCopyToClipboardNotification(
        <p className="small-text-semi">{`${column} ${t(BasicI18nKey.CopiedSuccessfully)}`}</p>,
      ),
    );
  };

  return (
    <DialPopup
      open
      header={column}
      size={PopupSize.Lg}
      className="h-[80vh]"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3 px-6 py-4">
          <DialNeutralButton label={t(ButtonsI18nKey.Close)} onClick={onClose} />
          <DialPrimaryButton
            label={t(QueryBuilderI18nKey.CopyValue)}
            iconBefore={<IconCopy {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onCopyValue}
          />
        </div>
      }
    >
      <div className="h-full px-6 py-4">
        <div className="h-full overflow-hidden rounded border border-primary">
          <Editor
            height="100%"
            language={language}
            value={text}
            theme={currentTheme}
            beforeMount={(monaco) =>
              monaco?.editor?.defineTheme(currentTheme, EDITOR_THEMES_CONFIG[currentTheme as EDITOR_THEMES])
            }
            options={EDITOR_OPTIONS}
          />
        </div>
      </div>
    </DialPopup>
  );
};

export default ResultValueDialog;
