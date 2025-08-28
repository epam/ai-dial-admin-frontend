import { FC } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import IconControl from '@/src/components/EntityMainProperties/BaseProperties/Icon';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';

interface Props {
  application: DialApplicationResource;
}

const ApplicationInfo: FC<Props> = ({ application }) => {
  const t = useI18n();

  return application ? (
    <div className="flex flex-col gap-y-6 w-full lg:w-[35%]">
      <DisplayNameControl readonly={true} displayName={application?.displayName} />
      <DescriptionControl entity={application} readonly={true} />

      <IconControl readonly={true} iconUrl={application.iconUrl} />

      <Multiselect
        readonly={true}
        elementId="topics"
        selectedItems={application?.descriptionKeywords}
        title={t(EntityFieldsI18nKey.topics)}
      />
    </div>
  ) : null;
};

export default ApplicationInfo;
