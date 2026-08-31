import { FC } from 'react';

import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';
import { ModelAssetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModelResource, DialModelResourceStatus } from '@/src/models/dial/resource';

interface Props {
  asset: DialModelResource;
}

/**
 * A model DIAL Core rejected during its merged-config rebuild is stored but not served. Core reports it
 * through a separate projection carrying an `invalid` status and, for admin callers, the warnings naming
 * the offending fields — without which an admin sees a saved model that silently never routes.
 */
const InvalidModelBanner: FC<Props> = ({ asset }) => {
  const t = useI18n();

  if (asset.status !== DialModelResourceStatus.Invalid) {
    return null;
  }

  const reasons = (asset.validationWarnings ?? [])
    .map((warning) => [warning.field, warning.message].filter(Boolean).join(': '))
    .filter(Boolean);

  return (
    <EntityBanner
      className="mb-4"
      title={t(ModelAssetI18nKey.InvalidTitle)}
      message={
        reasons.length
          ? `${t(ModelAssetI18nKey.InvalidMessage)} ${reasons.join('; ')}`
          : t(ModelAssetI18nKey.InvalidMessage)
      }
    />
  );
};

export default InvalidModelBanner;
