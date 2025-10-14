'use client';

import { FC, useEffect, useState } from 'react';

import classNames from 'classnames';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';

const ONLY_ADMIN_ENTITIES = [
  ApplicationRoute.Adapters,
  ApplicationRoute.InterceptorTemplates,
  ApplicationRoute.Prompts,
  ApplicationRoute.Files,
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

interface Props {
  view: ApplicationRoute;
  selectedFormat?: ExportFormat;
  setSelectedFormat?: (format: ExportFormat) => void;
  jsonEditorEnabled: boolean;
  toggleJsonEditor?: () => void;
}

const JsonToggles: FC<Props> = ({ view, jsonEditorEnabled, selectedFormat, setSelectedFormat, toggleJsonEditor }) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const staticEditorClassNames = 'pl-6 flex flex-row gap-x-3';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [editorClassNames, setEditorClassNames] = useState(staticEditorClassNames);

  const items: DropdownItemsModel[] = [
    {
      id: ExportFormat.CORE,
      name: t(EntitiesI18nKey.Core),
    },
    {
      id: ExportFormat.ADMIN,
      name: t(EntitiesI18nKey.Admin),
    },
  ];

  useEffect(() => {
    setEditorClassNames(
      classNames(
        staticEditorClassNames,
        isTablet ? 'ml-3 pl-3 border-l-tertiary border-l h-full flex items-center' : isMobile ? 'hidden' : '',
      ),
    );
  }, [isTablet, isMobile]);

  return (
    <div className={editorClassNames}>
      {jsonEditorEnabled && !ONLY_ADMIN_ENTITIES.includes(view) && (
        <Dropdown
          selectedValue={selectedFormat == ExportFormat.CORE ? items[0] : items[1]}
          selectedClassName="bg-layer-4 cursor-pointer h-[22px] px-1 small rounded flex items-center justify-center"
        >
          {items.map((item, i) => (
            <DropdownMenuItem
              key={i}
              dropdownItem={item}
              isActiveItem={selectedFormat === item.id}
              onClick={() => setSelectedFormat?.(item.id as ExportFormat)}
            />
          ))}
        </Dropdown>
      )}
      <DialSwitch
        isOn={jsonEditorEnabled}
        title={t(EntitiesI18nKey.JSONEditor)}
        switchId="jsonEditor"
        onChange={toggleJsonEditor}
      />
    </div>
  );
};

export default JsonToggles;
