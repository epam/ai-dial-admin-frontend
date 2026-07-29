import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IconControl from '@/src/components/BaseControls/Icon';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import IntroControl from '@/src/components/BaseControls/Intro';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import { MODEL_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModelResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';

interface Props {
  asset: DialModelResource;
  onChange: (asset: DialModelResource) => void;
}

const ModelAssetProperties: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <DisplayNameControl
          displayName={asset.displayName}
          required
          isFullWidth={false}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
        <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />
        <IntroControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

        <IconControl iconUrl={asset.iconUrl} onChange={(iconUrl) => onChange({ ...asset, iconUrl })} />
        <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsModels} />

        <InterfacesField entity={asset} onChangeEntity={onChange} allowedTypes={MODEL_INTERFACE_TYPES} isAsset />
        <EntityAttachments entity={asset} onChangeEntity={onChange} />
        <Defaults
          values={asset.defaults}
          onChangeValues={(defaults) => onChange({ ...asset, defaults })}
          title={t(EntityFieldsI18nKey.completionDefaults)}
        />
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
        <Limits model={asset} onChangeModel={onChange} />
        <Pricing model={asset} onChangeModel={onChange} />
      </div>
    </div>
  );
};

export default ModelAssetProperties;
