import { FC } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { CreateI18nKey, EntitiesI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationPublication } from '@/src/models/dial/publications';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import Multiselect from '../../Common/Multiselect/Multiselect';

interface Props {
  publication: ApplicationPublication;
}

const ApplicationProperties: FC<Props> = ({ publication }) => {
  const t = useI18n();

  const application = publication.applicationResources?.[0];

  return application ? (
    <div className="flex flex-col gap-y-6">
      <TextInputField
        elementId="displayName"
        readonly={true}
        fieldTitle={t(CreateI18nKey.NameTitle)}
        value={application?.displayName}
      />
      <TextInputField
        readonly={true}
        elementId="displayVersion"
        fieldTitle={t(CreateI18nKey.VersionTitle)}
        value={application?.displayVersion}
      />

      <TextInputField
        readonly={true}
        elementId="description"
        fieldTitle={t(CreateI18nKey.DescriptionTitle)}
        value={application?.description}
      />

      <EntityIcon fieldTitle={t(EntitiesI18nKey.Icon)} readonly={true} elementId="icon" entity={application} />

      <Multiselect
        readonly={true}
        elementId="topics"
        selectedItems={application?.topics}
        title={t(TopicsI18nKey.Topics)}
      />
    </div>
  ) : null;
};

export default ApplicationProperties;
