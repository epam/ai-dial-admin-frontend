import { DialDropdown, DialIconButton, DropdownItem } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { IconDotsVertical, IconDownload, IconUpload, IconWorldCog } from '@tabler/icons-react';

import { ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { MENU_ACTION_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  onExport: () => void;
  onImport?: () => void;
  onOpenProperties?: () => void;
  /** When false, Import / Export entries are omitted (e.g. read-only admin). */
  showImportExport?: boolean;
}

const MenuActions: FC<Props> = ({ onExport, onImport, onOpenProperties, showImportExport = true }) => {
  const t = useI18n();

  const dropdownItems: DropdownItem[] = [
    ...(showImportExport
      ? [
          {
            key: t(MenuI18nKey.ImportConfig),
            label: t(MenuI18nKey.ImportConfig),
            icon: <IconDownload className="text-secondary" {...MENU_ACTION_ICON_PROPS} />,
            onClick: onImport,
          },
          {
            key: t(MenuI18nKey.ExportConfig),
            label: t(MenuI18nKey.ExportConfig),
            icon: <IconUpload className="text-secondary" {...MENU_ACTION_ICON_PROPS} />,
            onClick: onExport,
          },
        ]
      : []),
    {
      key: t(MenuI18nKey.SystemProperties),
      label: t(MenuI18nKey.SystemProperties),
      icon: <IconWorldCog className="text-secondary" {...MENU_ACTION_ICON_PROPS} />,
      onClick: onOpenProperties,
    },
  ];

  return (
    <div>
      <DialDropdown items={dropdownItems} listClassName="w-[150px]">
        <DialIconButton
          aria-label={t(ButtonsI18nKey.Actions)}
          icon={<IconDotsVertical {...MENU_ACTION_ICON_PROPS} />}
          className="cursor-pointer"
        />
      </DialDropdown>
    </div>
  );
};

export default MenuActions;
