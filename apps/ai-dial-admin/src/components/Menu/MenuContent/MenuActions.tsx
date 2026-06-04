import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { IconDotsVertical, IconDownload, IconUpload, IconWorldCog } from '@tabler/icons-react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
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
            icon: <IconDownload className="text-secondary" {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />,
            onClick: onImport,
          },
          {
            key: t(MenuI18nKey.ExportConfig),
            label: t(MenuI18nKey.ExportConfig),
            icon: <IconUpload className="text-secondary" {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />,
            onClick: onExport,
          },
        ]
      : []),
    {
      key: t(MenuI18nKey.SystemProperties),
      label: t(MenuI18nKey.SystemProperties),
      icon: <IconWorldCog className="text-secondary" {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />,
      onClick: onOpenProperties,
    },
  ];

  return (
    <div>
      <DialDropdown items={dropdownItems} listClassName="w-[150px]">
        <IconDotsVertical className="cursor-pointer" />
      </DialDropdown>
    </div>
  );
};

export default MenuActions;
