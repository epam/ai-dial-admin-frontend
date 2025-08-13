import { FC, ReactNode } from 'react';

import classNames from 'classnames';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { ACTION_I18N_KEYS } from '@/src/constants/publications';
import { useI18n } from '@/src/locales/client';
import { ActionType, ApplicationPublication, Publication } from '@/src/models/dial/publications';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getActionClass } from '@/src/utils/publications';
import BasePublicationPermissions from './BasePublicationPermissions';
import { DialApplicationScheme } from '@/src/models/dial/application';

interface Props {
  publication: Publication;
  applicationSchemes?: DialApplicationScheme[] | null;
  children: ReactNode;
}

const BasePublicationProperties: FC<Props> = ({ publication, children, applicationSchemes }) => {
  const t = useI18n() as (str: string) => string;
  const indicatorClassNames = classNames(
    'flex w-2 h-2 mr-1 rounded no-user-select',
    getActionClass(publication.action),
  );

  const application = (publication as ApplicationPublication).applicationResources?.[0];
  const runnerId = application?.applicationTypeSchemaId;
  const runner = applicationSchemes?.find((app) => app.$id === runnerId);

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full" data-testid={'publication-header'}>
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex flex-row gap-8">
          {!application ? (
            <LabeledText label={t(PublicationsI18nKey.Action)}>
              <p className="truncate items-center">
                <span className={indicatorClassNames} />
                {t(ACTION_I18N_KEYS[publication.action])}
              </p>
            </LabeledText>
          ) : runnerId ? (
            <LabeledText label={t(PublicationsI18nKey.Runner)}>
              <p className="truncate items-center">{runner?.['dial:applicationTypeDisplayName'] || runnerId}</p>
            </LabeledText>
          ) : null}
          <LabeledText label={t(PublicationsI18nKey.Author)} text={publication.author} />
        </div>
        <div className="flex flex-col sm:flex-row gap-8">
          <LabeledText label={t(EntitiesI18nKey.CreatedAt)} text={formatDateTimeToLocalString(publication.createdAt)} />
          <LabeledText
            label={t(PublicationsI18nKey.FolderStorage)}
            text={removeTrailingSlash(decodeURIComponent(publication.folderId))}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 mt-8 pt-8 relative" data-testid={'publication-content'}>
        <div className="flex flex-col gap-6 h-full overflow-auto">{children}</div>
      </div>
      <div className="mt-8 pt-8" id="publication-permissions">
        <BasePublicationPermissions
          rules={publication.rules || []}
          folderId={decodeURIComponent(publication.folderId)}
          showCompare={publication.action === ActionType.ADD}
        />
      </div>
    </div>
  );
};

export default BasePublicationProperties;
