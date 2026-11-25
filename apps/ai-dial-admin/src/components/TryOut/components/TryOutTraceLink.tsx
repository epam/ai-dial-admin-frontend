'use client';

import { FC } from 'react';

import { ElementSize, OutlinedButton } from '@epam/ai-dial-ui-kit';

import Grafana from '@/public/images/icons/grafana.svg';
import { GrafanaLinksI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** Absent when Grafana is not configured or the request has no trace id, which renders nothing. */
  url?: string | null;
}

const OPEN_IN_NEW_TAB_FEATURES = 'noopener,noreferrer';

const TryOutTraceLink: FC<Props> = ({ url }) => {
  const t = useI18n();

  if (!url) {
    return null;
  }

  return (
    <OutlinedButton
      size={ElementSize.Small}
      className="w-fit"
      iconBefore={<Grafana aria-hidden />}
      label={
        <>
          {t(GrafanaLinksI18nKey.OpenTrace)} <span className="sr-only">({t(GrafanaLinksI18nKey.OpensInNewTab)})</span>
        </>
      }
      onClick={() => window.open(url, '_blank', OPEN_IN_NEW_TAB_FEATURES)}
    />
  );
};

export default TryOutTraceLink;
