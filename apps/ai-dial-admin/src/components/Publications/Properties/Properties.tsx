import { FC, ReactNode } from 'react';

import classNames from 'classnames';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ACTION_I18N_KEYS } from '@/src/constants/publications';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ActionType, ApplicationPublication, Publication } from '@/src/models/dial/publications';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getActionClass } from '@/src/utils/publications';
import PublicationPermissions from './Permissions';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  view: ApplicationRoute;
  publication: Publication;
  applicationSchemes?: DialApplicationScheme[] | null;
  children: ReactNode;
}

const BasePublicationProperties: FC<Props> = ({ view, publication, children, applicationSchemes }) => {
  const t = useI18n() as (str: string) => string;
  const indicatorClassNames = classNames(
    'flex w-2 h-2 mr-1 rounded no-user-select',
    getActionClass(publication.action),
  );

  const application = (publication as ApplicationPublication).applicationResources?.[0];
  const runnerId = application?.applicationTypeSchemaId;
  const runner = applicationSchemes?.find((app) => app.$id === runnerId);

  return (
    <div className="h-full flex flex-col divide-y divide-primary w-full">
      <div className="flex flex-col sm:flex-row gap-8">
        {(view === ApplicationRoute.Prompts || view === ApplicationRoute.Files) && (
          <LabelledText label={t(EntitiesI18nKey.Action)}>
            <p className="truncate items-center flex">
              <span className={indicatorClassNames} />
              {t(ACTION_I18N_KEYS[publication.action])}
            </p>
          </LabelledText>
        )}
        {runnerId && (
          <LabelledText label={t(EntitiesI18nKey.Runner)}>
            <p className="truncate items-center">{runner?.['dial:applicationTypeDisplayName'] || runnerId}</p>
          </LabelledText>
        )}
        {publication.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={publication.author} />}
        <LabelledText
          label={t(EntityFieldsI18nKey.createdAt)}
          text={formatDateTimeToLocalString(publication.createdAt)}
        />
        <LabelledText
          label={t(EntitiesI18nKey.FolderStorage)}
          text={removeTrailingSlash(decodeURIComponent(publication.folderId))}
        />
      </div>
      <div className="flex-1 min-h-0 mt-8 pt-8 relative">
        <div className="flex flex-col gap-y-8 h-full overflow-auto">{children}</div>
      </div>
      <div className="mt-8 pt-8" id="publication-permissions">
        <PublicationPermissions
          rules={publication.rules || []}
          folderId={decodeURIComponent(publication.folderId)}
          showCompare={publication.action === ActionType.ADD}
        />
      </div>
    </div>
  );
};

export default BasePublicationProperties;
