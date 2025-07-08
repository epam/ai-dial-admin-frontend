import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { useI18n } from '@/src/locales/client';

import { Publication } from '@/src/models/dial/publications';
import { ACTION_I18N_KEYS } from '@/src/constants/publications';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getActionClass } from '@/src/utils/publications';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { removeTrailingSlash } from '@/src/utils/files/path';

interface Props {
  publication: Publication;
  children: ReactNode;
}

const BasePublicationProperties: FC<Props> = ({ publication, children }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const indicatorClassNames = classNames(
    'flex w-2 h-2 mr-1 rounded no-user-select',
    getActionClass(publication.action),
  );

  return (
    <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full" data-testid={'publication-header'}>
      <div className="flex flex-row gap-10">
        <LabeledText label={t(PublicationsI18nKey.Action)}>
          <p className="flex items-center">
            <span className={indicatorClassNames} />
            {t(ACTION_I18N_KEYS[publication.action])}
          </p>
        </LabeledText>
        <LabeledText label={t(PublicationsI18nKey.Author)} text={publication.author} />
        <LabeledText label={t(PublicationsI18nKey.CreatedAt)} text={formatDateTimeToLocalString(publication.createdAt)} />
        <LabeledText label={t(PublicationsI18nKey.FolderStorage)} text={removeTrailingSlash(publication.folderId)} />
      </div>
      <div className="mt-8 pt-8" data-testid={'publication-content'}>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
};

export default BasePublicationProperties;
