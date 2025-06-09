import { FC } from 'react';
import { useI18n } from '@/src/locales/client';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { Publication } from '@/src/models/dial/publications';
import FilesList from '@/src/components/PublicationView/FileProperties/FilesList';

interface Props {
  publication: Publication;
}

const FilesProperties: FC<Props> = ({ publication }) => {
  const t = useI18n();

  return (
    <div data-testid="publication-file-view">
      <h3 className="text-primary mb-4">{t(PublicationsI18nKey.FilesListTitle)}</h3>

      <FilesList files={publication.files || []} action={publication.action} />
    </div>
  );
};

export default FilesProperties;
