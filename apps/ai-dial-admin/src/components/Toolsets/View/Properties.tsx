'use client';

import { FC } from 'react';

import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { Toolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import Authentication from './Authentication';
import { ToolsetTransport } from '@/src/types/toolset';
import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  selectedToolset: Toolset;
  names: string[];
  onChangeToolset: (toolset: Toolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  const t = useI18n();
  const transportOptions: DropdownItemsModel[] = [
    { id: ToolsetTransport.HTTP, name: ToolsetTransport.HTTP.toUpperCase() },
    { id: ToolsetTransport.SSE, name: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className="pt-3 w-full">
      <EntityHeader entity={selectedToolset} />
      <div className="flex-1 min-h-0 pt-4 flex flex-col">
        <EntityMainProperties
          entity={selectedToolset}
          onChangeEntity={onChangeToolset}
          names={names}
          isEntityImmutable={true}
          view={ApplicationRoute.Toolsets}
        />
        <div className="flex flex-col gap-y-6 lg:w-[35%] mt-6">
          <DropdownField
            fieldTitle={t(EntityFieldsI18nKey.transport)}
            selectedValue={selectedToolset.transport || ToolsetTransport.SSE}
            elementId="transport"
            items={transportOptions}
            onChange={(transport) => onChangeToolset({ ...selectedToolset, transport: transport as ToolsetTransport })}
          />
          <Authentication toolset={selectedToolset} onChange={onChangeToolset} />
          <MaxRetryAttempts entity={selectedToolset} onChangeEntity={onChangeToolset} />
        </div>
      </div>
    </div>
  );
};

export default ToolsetProperties;
