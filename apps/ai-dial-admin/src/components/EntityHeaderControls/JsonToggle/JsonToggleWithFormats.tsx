'use client';

import { FC } from 'react';

import { DialSelect, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import JsonToggles from './JsonToggle';
import { JsonConfiguration } from '../models';

const ONLY_ADMIN_ENTITIES = [
  ApplicationRoute.Adapters,
  ApplicationRoute.InterceptorTemplates,
  ApplicationRoute.Prompts,
  ApplicationRoute.Files,
  ApplicationRoute.AssetsApplications,
  ApplicationRoute.AssetsToolsets,
];

interface Props extends JsonConfiguration {
  view: ApplicationRoute;

  onHideFormatSelector?: () => void; // TODO: need? remove
}

const JsonToggleWithFormats: FC<Props> = ({
  view,
  isEditorEnabled,
  selectedFormat,
  onChangeSelectedFormat,
  onToggleEditor,
  onHideFormatSelector,
}) => {
  const t = useI18n();

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

  return (
    <JsonToggles isEditorEnabled={isEditorEnabled} onToggleEditor={onToggleEditor}>
      {isEditorEnabled && !ONLY_ADMIN_ENTITIES.includes(view) && !onHideFormatSelector?.() ? (
        <DialSelect
          size={SelectSize.Sm}
          variant={SelectVariant.Secondary}
          options={items}
          value={selectedFormat}
          onChange={(id) => onChangeSelectedFormat?.(id as ExportFormat)}
        />
      ) : null}
    </JsonToggles>
  );
};

export default JsonToggleWithFormats;
