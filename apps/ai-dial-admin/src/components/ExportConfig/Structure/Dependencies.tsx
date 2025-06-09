'use client';
import { FC, useMemo } from 'react';

import Field from '@/src/components/Common/Field/Field';
import Switch from '@/src/components/Common/Switch/Switch';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
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
      { key: 'entities', label: MenuI18nKey.Entities },
      { key: 'roles', label: MenuI18nKey.Roles },
      { key: 'keys', label: MenuI18nKey.Keys },
      { key: 'runners', label: MenuI18nKey.ApplicationRunners },
      { key: 'interceptors', label: MenuI18nKey.Interceptors },
    ];

    if (selectedExportFormat === ExportFormat.ADMIN) {
      // TODO: add after implementation api
      // res.push(
      //   ...([
      //     { key: 'prompts', label: MenuI18nKey.Prompts },
      //     { key: 'files', label: MenuI18nKey.Files },
      //   ] as SwitcherData[]),
      // );
    }
    return res;
  }, [selectedExportFormat]);

  return (
    <div className="flex flex-col h-full">
      <Field fieldTitle={t(ExportI18nKey.Dependencies)} htmlFor="dependencies" />
      <div className="flex flex-col gap-y-4 flex-1 min-h-0">
        {switches.map(({ key, label }) => (
          <Switch
            key={key}
            isOn={dependencies[key as keyof typeof dependencies]}
            title={t(label)}
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
