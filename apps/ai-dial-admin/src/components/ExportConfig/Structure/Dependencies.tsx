'use client';
import { FC, useMemo } from 'react';

import { DialLabel, DialSwitch, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ExportDependenciesConfig } from '@/src/models/export';
import { ExportFormat } from '@/src/types/export';

interface SwitcherData {
  key: keyof ExportDependenciesConfig;
  label: MenuI18nKey;
}
interface Props {
  selectedExportFormat: ExportFormat;
  dependencies: ExportDependenciesConfig;
  onChangeConfig: (config: ExportDependenciesConfig) => void;
}

const ExportDependencies: FC<Props> = ({ selectedExportFormat, dependencies, onChangeConfig }) => {
  const t = useI18n();

  const switches: SwitcherData[] = useMemo(() => {
    const res: SwitcherData[] = [
      { key: 'models', label: MenuI18nKey.Models },
      { key: 'applications', label: MenuI18nKey.Applications },
      { key: 'toolSets', label: MenuI18nKey.Toolsets },
      { key: 'interceptors', label: MenuI18nKey.Interceptors },
      { key: 'routes', label: MenuI18nKey.Routes },
      { key: 'runners', label: MenuI18nKey.ApplicationRunners },
      { key: 'roles', label: MenuI18nKey.Roles },
      { key: 'keys', label: MenuI18nKey.Keys },
    ];

    if (selectedExportFormat === ExportFormat.ADMIN) {
      res.splice(6, 0, { key: 'adapters', label: MenuI18nKey.Adapters });
      res.splice(7, 0, { key: 'interceptorsTemplates', label: MenuI18nKey.InterceptorTemplates });
    }

    return res;
  }, [selectedExportFormat]);

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center gap-x-2">
        <DialLabel label={t(ExportI18nKey.Resources)} htmlFor="dependencies" />
        <DialTooltip tooltip={t(ExportI18nKey.DependenciesInfo)}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" />
        </DialTooltip>
      </div>

      <div className="flex flex-col gap-y-3 flex-1 min-h-0">
        {switches.map(({ key, label }) => (
          <DialSwitch
            key={key}
            isOn={dependencies[key as keyof typeof dependencies]}
            label={t(label)}
            switchId={key}
            onChange={(value) =>
              onChangeConfig({
                ...dependencies,
                [key]: value,
              })
            }
          />
        ))}
      </div>
    </div>
  );
};

export default ExportDependencies;
