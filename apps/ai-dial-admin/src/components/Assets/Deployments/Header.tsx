import { FC } from 'react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import ValidityStatus from '@/src/components/EntityView/Status/ValidityStatus';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityValidityState } from '@/src/models/dial/base-entity';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import FoldersStorageLabel from '../Header/FolderStorage';

interface Props {
  asset: Asset | DialFile;
}

const AssetHeader: FC<Props> = ({ asset }) => {
  const t = useI18n();
  const validityState = (asset as EntityValidityState)?.validityState;

  return (
    <div className="flex flex-col sm:flex-row gap-8 pb-8 border-b border-primary">
      <LabelledText label={t(EntityFieldsI18nKey.id)} text={asset.name} copyable={true} />
      {asset.author && <LabelledText label={t(EntitiesI18nKey.Author)} text={asset.author} />}
      {asset.createdAt && (
        <LabelledText label={t(EntityFieldsI18nKey.createdAt)} text={formatDateTimeToLocalString(asset.createdAt)} />
      )}
      <LabelledText label={t(EntityFieldsI18nKey.updatedAt)} text={formatDateTimeToLocalString(asset.updatedAt)} />

      <FoldersStorageLabel asset={asset} />

      {validityState && (
        <LabelledText label={t(EntityFieldsI18nKey.status)}>
          <ValidityStatus validityState={validityState} />
        </LabelledText>
      )}
    </div>
  );
};

export default AssetHeader;
