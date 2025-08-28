'use client';

import { FC } from 'react';

import EntityHeader from '@/src/components/EntityView/Header/Header';
import { useI18n } from '@/src/locales/client';
import { DialToolset } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import EntityMainProperties from '../../EntityMainProperties/EntityMainProperties';

interface Props {
  selectedToolset: DialToolset;
  names: string[];
  onChangeToolset: (toolset: DialToolset) => void;
}

const ToolsetProperties: FC<Props> = ({ names, selectedToolset, onChangeToolset }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  return (
    <div className="pt-3 w-full lg:w-[35%]">
      <EntityHeader entity={selectedToolset} />
      <div className="flex-1 min-h-0 pt-4">
        <EntityMainProperties
          entity={selectedToolset}
          onChangeEntity={onChangeToolset}
          names={names}
          view={ApplicationRoute.Toolsets}
        />
      </div>
    </div>
  );
};

export default ToolsetProperties;
