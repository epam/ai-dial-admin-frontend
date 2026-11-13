'use client';

import { FC, useMemo } from 'react';

import { ButtonAppearance, ButtonDropdown, ButtonVariant, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import Grafana from '@/public/images/icons/grafana.svg';
import { GrafanaLinksI18nKey } from '@/src/constants/i18n';
import { MENU_ACTION_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { GrafanaTraceLinks } from '@/src/utils/grafana/models';

interface Props {
  /** Absent when Grafana is not configured, which renders nothing. */
  links?: GrafanaTraceLinks | null;
}

const OPEN_IN_NEW_TAB_FEATURES = 'noopener,noreferrer';

const ApplicationGrafanaLinks: FC<Props> = ({ links }) => {
  const t = useI18n();

  const items = useMemo((): DropdownItem[] => {
    if (!links) {
      return [];
    }

    const opensInNewTab = t(GrafanaLinksI18nKey.OpensInNewTab);
    const getItem = (key: string, label: string, url: string): DropdownItem => ({
      key,
      label: (
        <>
          {label}
          <span className="sr-only"> ({opensInNewTab})</span>
        </>
      ),
      iconAfter: <IconExternalLink {...MENU_ACTION_ICON_PROPS} aria-hidden />,
      onClick: () => window.open(url, '_blank', OPEN_IN_NEW_TAB_FEATURES),
    });

    return [
      getItem('all-traces', t(GrafanaLinksI18nKey.AllTraces), links.allTracesUrl),
      getItem('error-traces', t(GrafanaLinksI18nKey.ErrorTraces), links.errorTracesUrl),
    ];
  }, [links, t]);

  if (!links) {
    return null;
  }

  return (
    <ButtonDropdown
      label={t(GrafanaLinksI18nKey.Traces)}
      iconBefore={<Grafana aria-hidden />}
      items={items}
      variant={ButtonVariant.Neutral}
      appearance={ButtonAppearance.Outlined}
    />
  );
};

export default ApplicationGrafanaLinks;
