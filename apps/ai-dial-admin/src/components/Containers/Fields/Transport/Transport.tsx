import React, { FC } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { TRANSPORTS } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const Transport: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();

  return (
    <div className="max-w-[160px]">
      <DialSelectField
        elementId="transport"
        value={container.transport || TRANSPORTS[0].value}
        options={TRANSPORTS}
        fieldTitle={t(EntityFieldsI18nKey.Transport)}
        onChange={(transportId) => {
          const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];

          setContainer({
            ...container,
            transport: selectedTransport.value as CONTAINER_TRANSPORT,
          });
        }}
        optional={false}
      />
    </div>
  );
};

export default Transport;
