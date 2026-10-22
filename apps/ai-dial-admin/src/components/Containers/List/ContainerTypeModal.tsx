'use client';

import { DialFormPopup, RadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { toRadioItems } from '@/src/utils/radio-items';
import { FC, useMemo, useState } from 'react';

import { ContainerCreateSource } from '@/src/components/Containers/List/models';
import { getCreateSourceOptions } from '@/src/components/Containers/List/utils';
import { CONTAINER_TYPE_LABELS, UNIFIED_CONTAINER_TYPES } from '@/src/constants/deployments/container-types';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onContinue: (type: CONTAINER_TYPE, source: ContainerCreateSource) => void;
}

const ContainerTypeModal: FC<Props> = ({ isModalOpen, onClose, onContinue }) => {
  const t = useI18n();
  const { featureFlags } = useAppContext();

  const [type, setType] = useState<CONTAINER_TYPE>();
  const [source, setSource] = useState<ContainerCreateSource>();

  const typeOptions = useMemo(
    () =>
      UNIFIED_CONTAINER_TYPES.map((item) => ({
        id: item,
        name: t(CONTAINER_TYPE_LABELS[item] as string),
      })),
    [t],
  );
  const sourceOptions = useMemo(
    () => (type ? getCreateSourceOptions(type, t, !!featureFlags.mcpRegistryEnabled) : []),
    [type, t, featureFlags.mcpRegistryEnabled],
  );

  const onTypeChange = (id: string) => {
    setType(id as CONTAINER_TYPE);
    setSource(void 0);
  };

  return (
    <DialFormPopup
      portalId="ContainerTypeModal"
      open={isModalOpen}
      header={t(ContainersI18nKey.CreateContainerTitle)}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={() => type && source && onContinue(type, source)}
      submitLabel={t(ButtonsI18nKey.Next)}
      disableSubmitButton={!type || !source}
    >
      <div className="flex flex-col px-6 py-4 gap-6">
        <RadioGroup
          labelProps={{ label: t(ContainersI18nKey.ContainerTypeField) }}
          id="container-type"
          items={toRadioItems(typeOptions)}
          onChange={onTypeChange}
          value={type ?? ''}
          orientation={RadioGroupOrientation.Column}
        />
        {type && (
          <RadioGroup
            labelProps={{ label: t(ContainersI18nKey.ContainerSourceField) }}
            id="container-source"
            items={toRadioItems(sourceOptions)}
            onChange={(id) => setSource(id as ContainerCreateSource)}
            value={source ?? ''}
            orientation={RadioGroupOrientation.Column}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default ContainerTypeModal;
