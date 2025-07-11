import { FC, ReactNode } from 'react';

import classNames from 'classnames';
import { IconExternalLink } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { ACTION_I18N_KEYS } from '@/src/constants/publications';
import { useI18n } from '@/src/locales/client';
import { ActionType, ApplicationPublication, Publication } from '@/src/models/dial/publications';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { removeTrailingSlash } from '@/src/utils/files/path';
import { getActionClass } from '@/src/utils/publications';
import BasePublicationPermissions from './BasePublicationPermissions';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  publication: Publication;
  children: ReactNode;
}

const BasePublicationProperties: FC<Props> = ({ publication, children }) => {
  // TODO: add link to runner if available
  const applicationResource = (publication as ApplicationPublication).applicationResources?.[0];
  const t = useI18n() as (stringToTranslate: string) => string;
  const indicatorClassNames = classNames(
    'flex w-2 h-2 mr-1 rounded no-user-select',
    getActionClass(publication.action),
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full" data-testid={'publication-header'}>
      <div className="flex flex-col sm:flex-row gap-8">
        <div className="flex flex-row gap-8">
          {applicationResource ? (
            <LabeledText label={t(PublicationsI18nKey.Runner)}>
              <p
                className="flex items-center cursor-pointer"
                onClick={() =>
                  window.open(
                    `${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(applicationResource.displayName)}`,
                    '_blank',
                  )
                }
              >
                <span> {applicationResource.displayName}</span>
                <IconExternalLink width={16} height={16} className="ml-2 text-secondary" />
              </p>
            </LabeledText>
          ) : (
            <LabeledText label={t(PublicationsI18nKey.Action)}>
              <p className="flex items-center">
                <span className={indicatorClassNames} />
                {t(ACTION_I18N_KEYS[publication.action])}
              </p>
            </LabeledText>
          )}
          <LabeledText label={t(PublicationsI18nKey.Author)} text={publication.author} />
        </div>
        <div className="flex flex-col sm:flex-row gap-8">
          <LabeledText
            label={t(PublicationsI18nKey.CreatedAt)}
            text={formatDateTimeToLocalString(publication.createdAt)}
          />
          <LabeledText
            label={t(PublicationsI18nKey.FolderStorage)}
            text={removeTrailingSlash(decodeURIComponent(publication.folderId))}
          />
        </div>
      </div>
      <div className="mt-8 pt-8" data-testid={'publication-content'}>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
      <div className="mt-8 pt-8" data-testid={'publication-permissions'}>
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
