'use client';

import { FC, useEffect, useState } from 'react';

import { Container } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { isErrorPresent } from '@/src/utils/deployments/containers';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import ContainerNodePool from '@/src/components/Deployments/Fields/ContainerNodePool';
import ContainerResources from '@/src/components/Deployments/Fields/ContainerResources';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  route: ApplicationRoute;
  disabled?: boolean;
}

const ContainerCompute: FC<Props> = ({ container, setContainer, route, disabled }) => {
  const t = useI18n();
  const { errorFields, isValid } = useSaveValidationContext();
  const [isSectionInvalid, setIsSectionInvalid] = useState(false);

  useEffect(() => {
    if (!isValid) {
      setIsSectionInvalid(
        isErrorPresent(errorFields, ['gpuRequest', 'cpuRequest', 'cpuLimit', 'memoryRequest', 'memoryLimit']),
      );
    } else {
      setIsSectionInvalid(false);
    }
  }, [errorFields, isValid]);

  return (
    <Accordion title={t(EntityFieldsI18nKey.Compute)} errorIndicator={isSectionInvalid}>
      <div className="flex flex-col gap-y-8">
        <ContainerNodePool container={container} setContainer={setContainer} disabled={disabled} />
        <ContainerResources container={container} setContainer={setContainer} route={route} disabled={disabled} />
      </div>
    </Accordion>
  );
};

export default ContainerCompute;
