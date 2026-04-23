'use client';

import { AlertVariant, DialAlert, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconArrowDown } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { getContainerRoute } from '@/src/components/SourceField/utils';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getContainersByView } from '@/src/utils/deployments/containers';
import { getTranslatedEntity } from '@/src/utils/deployments/entity';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

interface Props {
  view: ApplicationRoute;
  containerId: string;
}

const ContainerStatusBanner = ({ view, containerId }: Props) => {
  const t = useI18n();
  const getReqRef = useRef(useProtectedRequest());

  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);

  useEffect(() => {
    const action = getContainersByView(view);
    if (!action) {
      return;
    }
    let ignore = false;
    getReqRef
      .current(action)
      .then((res) => {
        if (ignore) return;
        const containers = res.success ? ((res.response as Container[] | null) ?? []) : [];
        setSelectedContainer(containers.find((c) => c.name === containerId) ?? null);
      })
      .catch(() => {
        if (!ignore) setSelectedContainer(null);
      });
    return () => {
      ignore = true;
    };
  }, [view, containerId]);

  if (!selectedContainer || selectedContainer.status === CONTAINER_STATUS.RUNNING) {
    return null;
  }

  const type = getTranslatedEntity(getContainerRoute(view), t);

  return (
    <DialAlert
      className="mt-4"
      variant={AlertVariant.Warning}
      message={
        <div className="flex flex-col gap-1">
          <h3>{t(ContainersI18nKey.ContainerNotRunningTitle, { type, typeLower: type.toLowerCase() })}</h3>
          <span className="text-sm">
            {t(ContainersI18nKey.ContainerNotRunningDescription, { typeLower: type.toLowerCase() })}
          </span>
        </div>
      }
    >
      <DialNeutralButton
        size={ElementSize.Small}
        className="w-fit shrink-0"
        iconBefore={<IconArrowDown {...BASE_BUTTON_ICON_PROPS} />}
        label={t(ContainersI18nKey.GoToContainer)}
        onClick={() => onOpenInNewTab(getContainerRoute(view), { name: containerId })}
      />
    </DialAlert>
  );
};

export default ContainerStatusBanner;
