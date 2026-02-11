import { FC, useCallback, useMemo } from 'react';
import { DialTextInputField } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import classNames from 'classnames';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  image: Image;
  isModal?: boolean;
  setImage: (image: Image) => void;
}

const Branch: FC<Props> = ({ image, isModal = false, setImage }) => {
  const t = useI18n();
  const className = useMemo(() => getControlClassName(isModal), [isModal]);

  const onBranchChange = useCallback(
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

  const onSHAChange = useCallback(
    (sha?: string) => {
      setImage({
        ...image,
        source: {
          ...image.source,
          sha,
        },
      });
    },
    [image, setImage],
  );

  return (
    <div className={classNames('flex flex-row gap-x-4', className)}>
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.BranchName)}
        elementId="branch"
        placeholder={t(EntityPlaceholdersI18nKey.Branch)}
        value={image.source.branchName}
        disabled={false}
        optional={true}
        onChange={onBranchChange}
      />
      <DialTextInputField
        fieldTitle={t(EntityFieldsI18nKey.SHA)}
        elementId="SHA"
        placeholder={t(EntityPlaceholdersI18nKey.SHA)}
        value={image.source.sha}
        disabled={false}
        optional={true}
        onChange={onSHAChange}
      />
    </div>
  );
};

export default Branch;
