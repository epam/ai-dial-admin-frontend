'use client';

import { FC, useEffect, useState } from 'react';

import { DialSelect, DialSwitch, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import { EntityViewTab } from '@/src/components/EntityView/View/utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
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
  activeTab?: EntityViewTab;
  selectedFormat?: ExportFormat;
  setSelectedFormat?: (format: ExportFormat) => void;
  jsonEditorEnabled: boolean;
  toggleJsonEditor?: () => void;
}

const JsonToggles: FC<Props> = ({
  view,
  activeTab,
  jsonEditorEnabled,
  selectedFormat,
  setSelectedFormat,
  toggleJsonEditor,
}) => {
  const t = useI18n() as (value: string, options?: Record<string, string | number>) => string;
  const staticEditorClassNames = 'pl-6 flex flex-row gap-x-3';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [editorClassNames, setEditorClassNames] = useState(staticEditorClassNames);

  const items: SelectOption[] = [
    {
      value: ExportFormat.CORE,
      label: t(EntitiesI18nKey.Core),
    },
    {
      value: ExportFormat.ADMIN,
      label: t(EntitiesI18nKey.Admin),
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
    <div className={classNames(editorClassNames)}>
      {jsonEditorEnabled &&
      !ONLY_ADMIN_ENTITIES.includes(view) &&
      !(
        (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications) &&
        activeTab === EntityViewTab.Parameters
      ) ? (
        <DialSelect
          size={SelectSize.Sm}
          variant={SelectVariant.Secondary}
          options={items}
          value={selectedFormat}
          onChange={(id) => setSelectedFormat?.(id as ExportFormat)}
        />
      ) : null}
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
