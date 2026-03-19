import { FC } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
  disabled?: boolean;
}

const ContainerConfiguration: FC<Props> = ({ container, setContainer, disabled }) => {
  const t = useI18n();
  const isDisabled = disabled ?? isEditDisabled(container);

  return (
    <Accordion title={t(EntityFieldsI18nKey.Configuration)}>
      <div className="flex flex-col gap-6">
        <DialInput
          id="command"
          labelProps={{ label: t(EntityFieldsI18nKey.Command) }}
          value={container.command}
          onChange={(command?: string) => setContainer({ ...container, command })}
          placeholder={t(EntityPlaceholdersI18nKey.Command)}
          disabled={isDisabled}
        />

        <DialInput
          id="args"
          labelProps={{ label: t(EntityFieldsI18nKey.Arguments) }}
          value={container.args}
          onChange={(args?: string) => setContainer({ ...container, args })}
          placeholder={t(EntityPlaceholdersI18nKey.Arguments)}
          disabled={isDisabled}
        />
      </div>
    </Accordion>
  );
};

export default ContainerConfiguration;
