import { FC } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { Container } from '@/src/models/deployments/containers';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import Accordion from '@/src/components/Common/Accordion/Accordion';
import { isEditDisabled } from '@/src/utils/deployments/containers';

interface Props {
  container: Container;
  setContainer: (container: Container) => void;
}

const ContainerConfiguration: FC<Props> = ({ container, setContainer }) => {
  const t = useI18n();

  return (
    <Accordion title={t(EntityFieldsI18nKey.Configuration)}>
      <div className="flex flex-col gap-6">
        <DialTextInputField
          elementId="command"
          fieldTitle={t(EntityFieldsI18nKey.Command)}
          value={container.command}
          onChange={(command?: string) => setContainer({ ...container, command })}
          placeholder={t(EntityPlaceholdersI18nKey.Command)}
          optional={true}
          disabled={isEditDisabled(container)}
        />

        <DialTextInputField
          elementId="args"
          fieldTitle={t(EntityFieldsI18nKey.Arguments)}
          value={container.args}
          onChange={(args?: string) => setContainer({ ...container, args })}
          placeholder={t(EntityPlaceholdersI18nKey.Arguments)}
          optional={true}
          disabled={isEditDisabled(container)}
        />
      </div>
    </Accordion>
  );
};

export default ContainerConfiguration;
