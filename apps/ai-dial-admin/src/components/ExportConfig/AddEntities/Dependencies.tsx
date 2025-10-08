'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCheckbox, DialCollapsibleSidebar } from '@epam/ai-dial-ui-kit';

import { getAllAvailableDependencies, getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import { ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  selectedTab?: EntityType;
  selectedDependencies: EntityType[];
  onChangeSelectedDependencies: (dependencies: EntityType[]) => void;
}

const Dependencies: FC<Props> = ({ selectedTab, onChangeSelectedDependencies, selectedDependencies }) => {
  const t = useI18n() as (v: string) => string;
  const [allDependencies, setAllDependencies] = useState<EntityType[]>([]);

  const isAllSelected = useMemo(() => {
    return allDependencies.length === selectedDependencies.length;
  }, [allDependencies, selectedDependencies]);

  useEffect(() => {
    const dependencies = getAllAvailableDependencies(selectedTab);
    setAllDependencies(dependencies);
    onChangeSelectedDependencies(dependencies);
  }, [selectedTab, onChangeSelectedDependencies]);

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

  return (
    <DialCollapsibleSidebar
      width={256}
      title={t(ExportI18nKey.Dependencies)}
      containerCssClass="border border-primary ml-3"
    >
      <div className="flex flex-col">
        <h3 className="mb-3">{t(ExportI18nKey.Dependencies)}</h3>
        <div className="flex-1 min-h-0">
          <DialCheckbox
            checked={isAllSelected}
            id="all-dependencies"
            label={t(ExportI18nKey.AllDependencies)}
            onChange={onSelectAll}
          />
          <div className="flex flex-col pl-[20px] mt-3">
            {allDependencies.map((dep, i) => {
              return (
                <DialCheckbox
                  checked={selectedDependencies.includes(dep)}
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
  );
};

export default Dependencies;
