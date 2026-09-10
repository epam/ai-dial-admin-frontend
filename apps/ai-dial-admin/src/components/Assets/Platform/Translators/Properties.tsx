'use client';

import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import TranslatorCreateProperties from './CreateProperties';

interface Props {
  asset: DialTranslatorResource;
  onChange: (asset: DialTranslatorResource) => void;
}

/**
 * Properties tab for a translator asset: reuses `TranslatorCreateProperties` (`in`/`out`/`baseUrl` —
 * the only fields Core's `Translator` class declares) with `isModal={false}`, which hides the
 * immutable `id` field and sizes the inputs to `STANDARD_CONTROL_WIDTH` instead of the create
 * popup's full width. No display name, description, icon, endpoint list, features, or topics
 * control — `Translator` is a plain POJO, neither a `Deployment` nor a `RoleBasedEntity`.
 */
const TranslatorAssetProperties: FC<Props> = ({ asset, onChange }) => {
  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="mt-8">
        <TranslatorCreateProperties
          entity={asset}
          names={[]}
          onChangeEntity={(entity) => onChange(entity as DialTranslatorResource)}
          isModal={false}
        />
      </div>
    </div>
  );
};

export default TranslatorAssetProperties;
