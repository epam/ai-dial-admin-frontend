import { FC } from 'react';

import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';
import { ModelAssetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModelEndpoint } from '@/src/models/dial/model';
import { getUpstreamsLosingSecret } from '@/src/utils/models/upstream-secrets';

interface Props {
  originalUpstreams?: DialModelEndpoint[];
  editedUpstreams?: DialModelEndpoint[];
}

/**
 * Shown while editing rather than after saving, because by then the credential is already gone. DIAL
 * Core looks a stored upstream secret up by its endpoint, so changing an endpoint without re-entering
 * the key leaves nothing to carry over — and the save succeeds, so the only symptom is that the
 * upstream quietly stops authenticating.
 */
const UpstreamSecretWarning: FC<Props> = ({ originalUpstreams, editedUpstreams }) => {
  const t = useI18n();
  const affected = getUpstreamsLosingSecret(originalUpstreams, editedUpstreams);

  if (!affected.length) {
    return null;
  }

  const endpoints = affected.map((upstream) => upstream.endpoint).join(', ');

  return (
    <EntityBanner
      className="mb-4"
      title={t(ModelAssetI18nKey.SecretLossTitle)}
      message={`${t(ModelAssetI18nKey.SecretLossMessage)} ${endpoints}`}
    />
  );
};

export default UpstreamSecretWarning;
