import { FC } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Defaults from '@/src/components/Defaults/Defaults';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/EntityMainProperties/BaseProperties/MaxRetryAttempts';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';
import TokenizerModelSwitch from '@/src/components/ModelView/TokenizerModel/Tokenizer';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import ModelTypeProperties from './ModelTypeProperties';

interface Props {
  model: DialModel;
  modelsNames: string[];
  updateModel: (model: DialModel) => void;
}

const ModelProperties: FC<Props> = ({ model, modelsNames, updateModel }) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col pt-3 gap-6">
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={model}
        onChangeEntity={updateModel}
        names={modelsNames}
        isEntityImmutable={true}
      />
      <ModelTypeProperties model={model} onChangeModel={updateModel} />
      <Defaults entity={model} onChangeEntity={updateModel} />
      <UpstreamEndpoints entity={model} onChangeEntity={updateModel} isKeyOptional={true} />
      <TokenizerModelSwitch model={model} onChangeModel={updateModel} />
      <div className="w-full lg:w-[35%]">
        <ForwardAuthTokenField view={ApplicationRoute.Models} entity={model} onChangeEntity={updateModel} />
      </div>
      <Limits model={model} onChangeModel={updateModel} />
      <MaxRetryAttempts entity={model} onChangeEntity={updateModel} />
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
          addPlaceholder={t(EntityPlaceholdersI18nKey.Value)}
          addTitle={t(BasicI18nKey.AddField)}
          optional={true}
        />
      </div>
    </div>
  );
};

export default ModelProperties;
