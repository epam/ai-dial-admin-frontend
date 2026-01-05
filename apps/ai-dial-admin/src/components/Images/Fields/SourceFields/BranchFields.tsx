import { FC, useCallback } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';

interface Props {
  image: Image;
  setImage: (image: Image) => void;
}

const BranchFields: FC<Props> = ({ image, setImage }) => {
  const t = useI18n();

  const onChange = useCallback(
    (branchName?: string) => {
      setImage({
        ...image,
        source: {
          ...image.source,
          branchName,
        },
      });
    },
    [image, setImage],
  );

  return (
    <div className="flex gap-4">
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.BranchName)}
        elementId="branch"
        placeholder={t(EntityPlaceholdersI18nKey.Branch)}
        value={image.source.branchName}
        disabled={false}
        optional={true}
        onChange={onChange}
      />
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.SHA)}
        elementId="SHA"
        placeholder={t(EntityPlaceholdersI18nKey.SHA)}
        value={image.source.sha}
        disabled={false}
        optional={true}
        onChange={(sha?: string) => {
          setImage({
            ...image,
            source: {
              ...image.source,
              sha,
            },
          });
        }}
      />
    </div>
  );
};

export default BranchFields;
