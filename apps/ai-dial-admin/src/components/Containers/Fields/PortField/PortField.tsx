import React, { FC } from 'react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MODEL_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const PortField: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();

  return (
    <div className="flex gap-4">
      <DialNumberInputField
        containerClassName="max-w-[125px]"
        elementId="containerPort"
        fieldTitle={t(EntityFieldsI18nKey.Port)}
        placeholder={t(EntityPlaceholdersI18nKey.ContainerPort)}
        value={container.containerPort}
        optional={true}
        onChange={(containerPort?: number | string) => {
          if (containerPort === 0) {
            const { containerPort: __, ...rest } = container;
            setContainer(rest);
          } else {
            setContainer({
              ...container,
              containerPort: containerPort as number,
            });
          }
        }}
        disabled={isEditDisabled(container)}
        min={1}
        max={65535}
      />
      {container.source?.$type === MODEL_SOURCE_TYPE.NIM && (
        <DialNumberInputField
          containerClassName="max-w-[125px]"
          elementId="containerGrpcPort"
          fieldTitle={t(EntityFieldsI18nKey.GRPCPort)}
          placeholder={t(EntityPlaceholdersI18nKey.ContainerPort)}
          value={container.containerGrpcPort}
          optional={true}
          onChange={(containerGrpcPort?: number | string) => {
            if (containerGrpcPort === 0) {
              const { containerGrpcPort: __, ...rest } = container;
              setContainer(rest);
            } else {
              setContainer({
                ...container,
                containerGrpcPort: containerGrpcPort as number,
              });
            }
          }}
          disabled={isEditDisabled(container)}
          min={1}
          max={65535}
        />
      )}
    </div>
  );
};

export default PortField;
