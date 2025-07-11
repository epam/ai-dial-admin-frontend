import { FC } from 'react';

import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { CreateI18nKey, EntitiesI18nKey, TopicsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import EntityIcon from '@/src/components/EntityView/Properties/EntityIcon';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { DialApplicationResource } from '@/src/models/dial/application-resource';

interface Props {
  application: DialApplicationResource;
}

const ApplicationInfo: FC<Props> = ({ application }) => {
  const t = useI18n();

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
        selectedItems={application?.descriptionKeywords}
        title={t(TopicsI18nKey.Topics)}
      />
    </div>
  ) : null;
};

export default ApplicationInfo;
