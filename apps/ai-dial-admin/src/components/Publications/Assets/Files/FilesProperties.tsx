import { FC } from 'react';
import { DialNoDataContent } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { EntitiesI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { FilePublication } from '@/src/models/dial/publications';
import FilesList from '@/src/components/Publications/Assets/Files/FilesList';

interface Props {
  publication: FilePublication;
}

const FilesProperties: FC<Props> = ({ publication }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-primary mb-4">{t(PublicationsI18nKey.FilesListTitle)}</h3>

      <div className="flex-1 min-h-0">
        {publication.files && publication.files.length > 0 ? (
          <FilesList files={publication.files} action={publication.action} />
        ) : (
          <DialNoDataContent title={t(EntitiesI18nKey.NoFiles)} />
        )}
      </div>
    </div>
  );
};

export default FilesProperties;
