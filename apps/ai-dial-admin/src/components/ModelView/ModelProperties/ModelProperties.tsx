import { FC, useCallback } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import UpstreamEndpoints from '@/src/components/Endpoints/UpstreamEndpoints';
import EntityMainProperties from '@/src/components/EntityMainProperties/EntityMainProperties';
import ForwardAuthTokenField from '@/src/components/EntityView/Properties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/MaxRetryAttempts/MaxRetryAttempts';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';
import TokenizerModelSwitch from '@/src/components/ModelView/TokenizerModel/Tokenizer';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import ModelTypeProperties from './ModelTypeProperties';
import { EntityFieldsI18nKey, HashingOrderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  model: DialModel;
  modelsNames: string[];
  updateModel: (model: DialModel) => void;
}

const ModelProperties: FC<Props> = ({ model, modelsNames, updateModel }) => {
  const t = useI18n();

  const onChangeMaxRetryAttempts = useCallback(
    (maxRetryAttempts?: number) => {
      updateModel({ ...model, maxRetryAttempts });
    },
    [updateModel, model],
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary">
      <div className="flex flex-col gap-6">
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
        <div className="w-full lg:w-[35%]">
          <Multiselect
            elementId="order"
            draggable={true}
            selectedItems={model.fieldsHashingOrder || []}
            allItems={model.fieldsHashingOrder || []}
            onChangeItems={(fieldsHashingOrder) => {
              updateModel({ ...model, fieldsHashingOrder });
            }}
            heading={t(EntityFieldsI18nKey.fieldsHashingOrder)}
            title={t(EntityFieldsI18nKey.fieldsHashingOrder)}
            addPlaceholder={t(HashingOrderI18nKey.HashingOrderPlaceholder)}
            addTitle={t(HashingOrderI18nKey.Add)}
            optional={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ModelProperties;
