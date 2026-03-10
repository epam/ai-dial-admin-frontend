import { DialFormPopup, DialSelectField, PopupSize, SelectOption } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useState } from 'react';

import { ButtonsI18nKey, SettingsModalI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: { theme?: string }) => void;
}

const SettingsModal: FC<Props> = ({ onConfirm, isModalOpen, onClose }) => {
  const t = useI18n();
  const { themes, currentTheme } = useTheme();
  const allThemes = themes?.map((theme) => ({ value: theme.id, label: theme.displayName }) as SelectOption);
  const [selectedTheme, setSelectedTheme] = useState(allThemes?.find((theme) => theme.value === currentTheme));
  const [settings, setSettings] = useState({ theme: selectedTheme?.value });

  const onChangeTheme = useCallback(
    (theme: string) => {
      setSelectedTheme(allThemes?.find((t) => t.value === theme));
      setSettings({ ...settings, theme });
    },
    [setSettings, allThemes, settings],
  );

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(SettingsModalI18nKey.Settings)}
      portalId="SettingsModal"
      open={isModalOpen}
      size={PopupSize.Sm}
      submitLabel={t(ButtonsI18nKey.Save)}
      onSubmit={() => onConfirm(settings)}
    >
      <div className="flex flex-col gap-4 p-6">
        <DialSelectField
          id="themeSelector"
          label={t(SettingsModalI18nKey.Theme)}
          options={allThemes || []}
          value={selectedTheme?.value}
          onChange={(theme) => onChangeTheme(theme as string)}
        />
      </div>
    </DialFormPopup>
  );
};

export default SettingsModal;
