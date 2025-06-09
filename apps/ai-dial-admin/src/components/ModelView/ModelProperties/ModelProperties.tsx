import { FC, useCallback } from 'react';

import UpstreamEndpoints from '@/src/components/Endpoints/UpstreamEndpoints';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import Limits from './Limits/Limits';
import ModelTypeProperties from './ModelTypeProperties';
import Pricing from './Pricing/Pricing';
import TokenizerModelSwitch from './TokenizerModel/Tokenizer';

interface Props {
  model: DialModel;
  modelsNames: string[];
  updateModel: (model: DialModel) => void;
}

const ModelProperties: FC<Props> = ({ model, modelsNames, updateModel }) => {
  const onChangeMaxRetryAttempts = useCallback(
    (maxRetryAttempts?: number) => {
      updateModel({ ...model, maxRetryAttempts });
    },
    [updateModel, model],
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary">
      <div className="flex flex-col gap-6 lg:w-[35%]">
        <EntityMainProperties
          view={ApplicationRoute.Models}
          entity={model}
          onChangeEntity={updateModel}
          names={modelsNames}
          isEntityImmutable={true}
        />
        <ModelTypeProperties model={model} onChangeModel={updateModel} />
      </div>

      <div className="flex flex-col gap-6 mt-4 pt-4">
        <UpstreamEndpoints entity={model} onChangeEntity={updateModel} isKeyOptional={true} />
        <TokenizerModelSwitch model={model} onChangeModel={updateModel} />
        <div className="w-full lg:w-[35%]">
          <ForwardAuthTokenField view={ApplicationRoute.Models} entity={model} onChangeEntity={updateModel} />
        </div>
        <Limits model={model} onChangeModel={updateModel} />
        <MaxRetryAttempts
          maxRetryAttempts={model.maxRetryAttempts}
          onChangeMaxRetryAttempts={onChangeMaxRetryAttempts}
        />
        <Pricing model={model} onChangeModel={updateModel} />
      </div>
    </div>
  );
};

export default ModelProperties;
