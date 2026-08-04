'use client';

import { FC } from 'react';

import IconControl from '@/src/components/BaseControls/Icon';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import { DialModel, DialModelType } from '@/src/models/dial/model';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}

const ModelTypeProperties: FC<Props> = ({ model, onChangeModel }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      <OverrideNameControl entity={model} onChangeEntity={onChangeModel} />
      {model.type === DialModelType.Chat && (
        <>
          <IconControl iconUrl={model.iconUrl} onChange={(icon) => onChangeModel({ ...model, iconUrl: icon })} />
          <TopicsControl entity={model} onChange={onChangeModel} />
          <EntityAttachments entity={model} onChangeEntity={onChangeModel} />
        </>
      )}
    </div>
  );
};

export default ModelTypeProperties;
