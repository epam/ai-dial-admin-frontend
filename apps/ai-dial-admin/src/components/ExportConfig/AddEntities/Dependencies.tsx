'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCheckbox, DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import { ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat } from '@/src/types/export';
import { getAllAvailableDependencies } from '@/src/utils/entities/get-export-deps';

interface Props {
  selectedTab?: EntityType;
  selectedExportFormat?: ExportFormat;
  selectedDependencies: EntityType[];
  onChangeSelectedDependencies: (dependencies: EntityType[]) => void;
  disabled?: boolean;
}

const Dependencies: FC<Props> = ({
  selectedTab,
  selectedExportFormat,
  onChangeSelectedDependencies,
  selectedDependencies,
  disabled,
}) => {
  const t = useI18n();
  const [allDependencies, setAllDependencies] = useState<EntityType[]>([]);

  const isAllSelected = useMemo(() => {
    return allDependencies.length === selectedDependencies.length;
  }, [allDependencies, selectedDependencies]);

  useEffect(() => {
    const dependencies = getAllAvailableDependencies(selectedTab, selectedExportFormat === ExportFormat.CORE);
    setAllDependencies(dependencies);
    onChangeSelectedDependencies(dependencies);
  }, [selectedTab, selectedExportFormat, onChangeSelectedDependencies]);

  const onChange = useCallback(
    (value: boolean | undefined, key: EntityType) => {
      if (value) {
        onChangeSelectedDependencies([...selectedDependencies, key]);
      } else {
        onChangeSelectedDependencies(selectedDependencies.filter((d) => d !== key));
      }
    },
    [onChangeSelectedDependencies, selectedDependencies],
  );

  const onSelectAll = useCallback(() => {
    if (isAllSelected) {
      onChangeSelectedDependencies([]);
    } else {
      onChangeSelectedDependencies(allDependencies);
    }
  }, [allDependencies, isAllSelected, onChangeSelectedDependencies]);

  return allDependencies.length ? (
    <DialCollapsibleSidebar
      width={256}
      title={t(ExportI18nKey.Dependencies)}
      containerClassName="border border-primary ml-3"
    >
      <div className="flex flex-col">
        <h3 className="mb-3">{t(ExportI18nKey.Dependencies)}</h3>
        <div className="flex-1 min-h-0">
          {!disabled && (
            <DialCheckbox
              checked={isAllSelected}
              id="all-dependencies"
              label={t(ExportI18nKey.AllDependencies)}
              onChange={onSelectAll}
            />
          )}
          <div className={`flex flex-col ${disabled ? '' : 'pl-[20px] mt-3'} gap-y-3`}>
            {allDependencies.map((dep, i) => {
              return (
                <DialCheckbox
                  checked={selectedDependencies.includes(dep)}
                  disabled={disabled}
                  id={dep}
                  key={i}
                  label={getButtonTitle(t, dep)}
                  onChange={(v) => onChange(v, dep)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DialCollapsibleSidebar>
  ) : null;
};

export default Dependencies;
