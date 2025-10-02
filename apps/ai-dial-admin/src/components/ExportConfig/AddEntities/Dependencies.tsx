'use client';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import classNames from 'classnames';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import Button from '@/src/components/Common/Button/Button';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Popup from '@/src/components/Common/Popup/Popup';
import { getAllAvailableDependencies, getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import Grid from '@/src/components/Grid/Grid';
import { CHECKBOX_COL_DEF } from '@/src/constants/ag-grid';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { PopUpState } from '@/src/types/pop-up';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import HorizontalCollapseBar from '../../Common/HorizontalCollapseBar/HorizontalCollapseBar';

interface Props {
  selectedTab?: EntityType;
}

const Dependencies: FC<Props> = ({ selectedTab }) => {
  const t = useI18n() as (v: string) => string;
  const [selectedEntities, setSelectedEntities] = useState<EntitiesGridData[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<EntityType[]>([]);
  const [allDependencies, setAllDependencies] = useState<EntityType[]>([]);
  const [includeDependencies, setIncludeDependencies] = useState(false);

  useEffect(() => {
    const dependencies = getAllAvailableDependencies(selectedTab);
    setAllDependencies(dependencies);
    setSelectedDependencies(dependencies);
  }, [selectedTab]);

  return (
    <HorizontalCollapseBar
      width="256"
      title={t(ExportI18nKey.Dependencies)}
      containerClass="border border-primary ml-3"
    >
      <div className="flex flex-col">
        <h3 className="mb-3">{t(ExportI18nKey.Dependencies)}</h3>
        <div className="flex-1 min-h-0"></div>
        {includeDependencies && (
          <div className="flex flex-col gap-4 w-fit rounded border border-primary p-4">
            {allDependencies.map((dep, i) => {
              return (
                <DialSwitch
                  key={i}
                  isOn={selectedDependencies.includes(dep)}
                  title={getButtonTitle(t, dep)}
                  switchId={dep}
                  onChange={(v) => onChangeSelectedDependencies(v, dep)}
                />
              );
            })}
          </div>
        )}
      </div>
    </HorizontalCollapseBar>
  );
};

export default Dependencies;
