'use client';

import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { PluginI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialPluginResource } from '@/src/models/dial/resource';
import PluginCreateProperties from './CreateProperties';

interface Props {
  asset: DialPluginResource;
  onChange: (asset: DialPluginResource) => void;
}

/**
 * Properties tab for a plugin asset: reuses `PluginCreateProperties` (`type`/`settings` — the only
 * fields Core's `Plugin` declares) with `isModal={false}`, which hides the immutable `id` field and
 * sizes the inputs to `STANDARD_CONTROL_WIDTH`. Plugins are a preview Core feature, so the tab opens
 * with a notice saying so.
 */
const PluginAssetProperties: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <p role="note" className="mt-4 text-secondary">
        {t(PluginI18nKey.PreviewNotice)}
      </p>
      <div className="mt-8">
        <PluginCreateProperties
          entity={asset}
          names={[]}
          onChangeEntity={(entity) => onChange(entity as DialPluginResource)}
          isModal={false}
        />
      </div>
    </div>
  );
};

export default PluginAssetProperties;
