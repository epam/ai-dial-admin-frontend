import { FC, useCallback, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { useTheme } from '@/src/context/ThemeContext';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

interface Props {
  modalState: PopUpState;
  onClose: () => void;
  onConfirm: (settings: { theme?: string }) => void;
}

const SettingsModal: FC<Props> = ({ onConfirm, modalState, onClose }) => {
  const t = useI18n();
  const { themes, currentTheme } = useTheme();
  const allThemes = themes?.map((theme) => ({ id: theme.id, name: theme.displayName }) as DropdownItemsModel);
  const [selectedTheme, setSelectedTheme] = useState(allThemes?.find((theme) => theme.id === currentTheme));
  const [settings, setSettings] = useState({ theme: selectedTheme?.id });

  const onChangeTheme = useCallback(
    (theme: string) => {
      setSelectedTheme(allThemes?.find((t) => t.id === theme));
      setSettings({ ...settings, theme });
    },
    [setSettings, allThemes, settings],
  );

  return (
    <Popup onClose={onClose} heading={t(BasicI18nKey.Settings)} portalId="SettingsModal" state={modalState}>
      <div className="flex flex-col gap-4 py-6 px-6">
        <DropdownField
          elementId="themeSelector"
          fieldTitle={t(BasicI18nKey.Theme)}
          items={allThemes || []}
          selectedValue={selectedTheme?.id}
          onChange={onChangeTheme}
        />
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="primary" title={t(ButtonsI18nKey.Save)} onClick={() => onConfirm(settings)} />
      </div>
    </Popup>
  );
};

export default SettingsModal;
