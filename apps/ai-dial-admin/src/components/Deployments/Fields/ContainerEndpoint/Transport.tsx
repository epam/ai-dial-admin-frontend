import React, { FC } from 'react';
import { DialSelectField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { TRANSPORTS } from '@/src/constants/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const Transport: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);

  return (
    <DialSelectField
      id="transport"
      value={container.transport || TRANSPORTS[0].value}
      options={TRANSPORTS}
      containerClassName="max-w-[160px]"
      label={t(EntityFieldsI18nKey.Transport)}
      onChange={(transportId) => {
        const selectedTransport = TRANSPORTS.find((source) => source.value === transportId) || TRANSPORTS[0];

        setContainer({
          ...container,
          transport: selectedTransport.value as CONTAINER_TRANSPORT,
        });
      }}
      required
      disabled={isDisabled}
    />
  );
};

export default Transport;
