import { DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { IconDotsVertical, IconDownload, IconUpload } from '@tabler/icons-react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  onExport: () => void;
  onImport?: () => void;
}

const MenuActions: FC<Props> = ({ onExport, onImport }) => {
  const t = useI18n();

  const dropdownItems: DropdownItem[] = [
    {
      key: t(MenuI18nKey.ImportConfig),
      label: t(MenuI18nKey.ImportConfig),
      icon: <IconDownload {...BASE_ICON_PROPS} widths={24} height={24} />,
      onClick: onImport,
    },
    {
      key: t(MenuI18nKey.ExportConfig),
      label: t(MenuI18nKey.ExportConfig),
      icon: <IconUpload {...BASE_ICON_PROPS} widths={24} height={24} />,
      onClick: onExport,
    },
  ];

  return (
    <div>
      <DialDropdown menu={{ items: dropdownItems }} cssClass="w-[150px]">
        <IconDotsVertical className="cursor-pointer" />
      </DialDropdown>
    </div>
  );
};

export default MenuActions;
