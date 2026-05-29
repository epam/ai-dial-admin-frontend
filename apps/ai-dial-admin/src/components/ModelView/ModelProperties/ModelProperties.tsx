'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { getModelsAdapters } from '@/src/app/[lang]/models/actions';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import Defaults from '@/src/components/Defaults/Defaults';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';
import TokenizerModelSwitch from '@/src/components/Models/View/TokenizerModel/Tokenizer';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialModel } from '@/src/models/dial/model';
import { ApplicationRoute } from '@/src/types/routes';
import {
  clearUpstreamResponsesEndpoints,
  shouldClearUpstreamResponsesEndpoints,
} from '@/src/utils/models/upstream-responses';
import ModelTypeProperties from './ModelTypeProperties';

interface Props {
  model: DialModel;
  modelsNames: string[];
  onChangeModel: (model: DialModel) => void;
}

const ModelProperties: FC<Props> = ({ model, modelsNames, onChangeModel }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const getReqRef = useRef(useProtectedRequest());
  const [selectedAdapter, setSelectedAdapter] = useState<DialAdapter | null>(null);

  useEffect(() => {
    if (model.source?.$type === SOURCE_TYPE.ADAPTER && model.source?.adapterName) {
      getReqRef.current(getModelsAdapters).then((res) => {
        if (res.success) {
          const adapters: DialAdapter[] = res.response || [];
          setSelectedAdapter(adapters.find((a) => a.name === model.source?.adapterName) ?? null);
        }
      });
    } else {
      setSelectedAdapter(null);
    }
  }, [model.source?.$type, model.source?.adapterName]);

  const showResponsesDefaults =
    (model.source?.$type === SOURCE_TYPE.ENDPOINTS && !!model.responsesEndpoint) ||
    (model.source?.$type === SOURCE_TYPE.ADAPTER && !!selectedAdapter?.responsesEndpoint) ||
    (model.source?.$type === SOURCE_TYPE.CONTAINER && !!model.source?.responsesEndpointPath);

  useEffect(() => {
    if (!shouldClearUpstreamResponsesEndpoints(model, showResponsesDefaults, selectedAdapter)) {
      return;
    }
    onChangeModel(clearUpstreamResponsesEndpoints(model));
    // Runs when responses visibility or adapter resolution changes, not on every model edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResponsesDefaults, selectedAdapter]);

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

      <Defaults entity={model} onChangeEntity={onChangeModel} title={t(EntityFieldsI18nKey.completionDefaults)} />

      {showResponsesDefaults && (
        <Defaults
          entity={model}
          onChangeEntity={onChangeModel}
          title={t(EntityFieldsI18nKey.responsesDefaults)}
          valuesKey="responsesDefaults"
          tempKey="responsesDefaultsTemp"
          validationKey="responsesDefaultKeys"
        />
      )}

      <UpstreamEndpoints
        entity={model}
        onChangeEntity={onChangeModel}
        isKeyOptional
        view={ApplicationRoute.Models}
        withResponses={showResponsesDefaults}
      />

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
        label={t(EntityFieldsI18nKey.fieldsHashingOrder)}
        addPlaceholder={t(EntityPlaceholdersI18nKey.Value)}
        addTitle={t(BasicI18nKey.AddField)}
        disabled={isReadOnlyAdmin}
      />
    </div>
  );
};

export default ModelProperties;
