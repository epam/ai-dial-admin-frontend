'use client';

import { FC, useEffect, useState } from 'react';

import { DialSelect, DialSwitch, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

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
  selectedFormat?: ExportFormat;
  isJsonEditorEnabled?: boolean;

  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onToggleJsonEditor?: () => void;
  onHideFormatSelector?: () => void;
}

const JsonToggles: FC<Props> = ({
  view,
  isJsonEditorEnabled,
  selectedFormat,
  onChangeSelectedFormat,
  onToggleJsonEditor,
  onHideFormatSelector,
}) => {
  const t = useI18n() as (value: string, options?: Record<string, string | number>) => string;
  const staticEditorClassName = 'flex flex-row gap-x-4';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [editorClassName, setEditorClassName] = useState(staticEditorClassName);

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
    setEditorClassName(
      classNames(
        staticEditorClassName,
        isTablet ? 'ml-3 pl-3 border-l-tertiary border-l h-full flex items-center' : isMobile && 'hidden',
      ),
    );
  }, [isTablet, isMobile]);

  return (
    <div className={editorClassName}>
      <div className="w-[1px] h-6 bg-layer-4"></div>
      {isJsonEditorEnabled && !ONLY_ADMIN_ENTITIES.includes(view) && !onHideFormatSelector?.() ? (
        <DialSelect
          size={SelectSize.Sm}
          variant={SelectVariant.Secondary}
          options={items}
          value={selectedFormat}
          onChange={(id) => onChangeSelectedFormat?.(id as ExportFormat)}
        />
      ) : null}

      <DialSwitch
        isOn={isJsonEditorEnabled}
        title={t(EntitiesI18nKey.JSONEditor)}
        switchId="jsonEditor"
        onChange={onToggleJsonEditor}
      />
    </div>
  );
};

export default JsonToggles;
