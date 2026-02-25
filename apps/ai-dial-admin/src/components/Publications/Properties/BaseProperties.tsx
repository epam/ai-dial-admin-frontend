import { DialInput } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo } from 'react';

import FilePath from '@/src/components/Common/FilePath/FilePath';
import { ROOT_FOLDER } from '@/src/constants/file';
import { BasicI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FilePublication } from '@/src/models/dial/publications';
import { getControlClassName } from '@/src/utils/entities/view';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';

interface Props {
  publication: FilePublication;
  onChange?: (publication: FilePublication) => void;
  getContext: () => AssetsFolderContext;
}

const BaseProperties: FC<Props> = ({ publication, onChange, getContext }) => {
  const t = useI18n();
  const containerClassName = useMemo(() => getControlClassName(false), []);
  const { fetchFiles, files } = getContext();

  useEffect(() => {
    if (!files.length) {
      fetchFiles(`${ROOT_FOLDER}/`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <DialInput
        labelProps={{ title: t(EntityFieldsI18nKey.displayAuthor) }}
        placeholder={t(EntityPlaceholdersI18nKey.DisplayAuthor)}
        id="author"
        value={publication.displayAuthor || ''}
        onChange={(displayAuthor) => onChange?.({ ...publication, displayAuthor })}
        containerClassName={containerClassName}
      />
      <FilePath
        value={publication.folderId}
        label={t(EntitiesI18nKey.FolderStorage)}
        modalTitle={t(BasicI18nKey.MoveToFolder)}
        placeholder={t(EntityPlaceholdersI18nKey.Path)}
        onChange={(folderId) => onChange?.({ ...publication, folderId })}
        context={getContext}
      />
    </>
  );
};

export default BaseProperties;
