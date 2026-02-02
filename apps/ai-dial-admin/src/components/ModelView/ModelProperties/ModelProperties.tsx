import { FC } from 'react';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Defaults from '@/src/components/Defaults/Defaults';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';
import TokenizerModelSwitch from '@/src/components/Models/View/TokenizerModel/Tokenizer';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import ModelTypeProperties from './ModelTypeProperties';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';

interface Props {
  model: DialModel;
  modelsNames: string[];
  onChangeModel: (model: DialModel) => void;
}

const ModelProperties: FC<Props> = ({ model, modelsNames, onChangeModel }) => {
  const t = useI18n();

  return (
    <div className="h-full flex flex-col gap-8">
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={model}
        onChangeEntity={onChangeModel}
        names={modelsNames}
        isEntityImmutable={true}
      />

      <ModelTypeProperties model={model} onChangeModel={onChangeModel} />

      <Defaults entity={model} onChangeEntity={onChangeModel} />

      <UpstreamEndpoints entity={model} onChangeEntity={onChangeModel} isKeyOptional={true} />

      <TokenizerModelSwitch model={model} onChangeModel={onChangeModel} />

      <ForwardAuthTokenField view={ApplicationRoute.Models} entity={model} onChangeEntity={onChangeModel} />

      <Limits model={model} onChangeModel={onChangeModel} />

      <MaxRetryAttempts entity={model} onChangeEntity={onChangeModel} />

      <Pricing model={model} onChangeModel={onChangeModel} />
      <Multiselect
        elementId="order"
        className={STANDARD_CONTROL_WIDTH}
        draggable={true}
        selectedItems={model.fieldsHashingOrder || []}
        allItems={model.fieldsHashingOrder || []}
        onChangeItems={(fieldsHashingOrder) => {
          onChangeModel({ ...model, fieldsHashingOrder });
        }}
        heading={t(EntityFieldsI18nKey.fieldsHashingOrder)}
        title={t(EntityFieldsI18nKey.fieldsHashingOrder)}
        addPlaceholder={t(EntityPlaceholdersI18nKey.Value)}
        addTitle={t(BasicI18nKey.AddField)}
        optional={true}
      />
    </div>
  );
};

export default ModelProperties;
