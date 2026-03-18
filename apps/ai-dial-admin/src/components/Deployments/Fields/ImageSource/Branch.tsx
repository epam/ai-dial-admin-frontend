import { FC, useCallback, useMemo } from 'react';
import { DialInput } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
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
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
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
      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.BranchName) }}
        id="branch"
        placeholder={t(EntityPlaceholdersI18nKey.Branch)}
        value={image.source.branchName}
        disabled={isReadOnlyAdmin}
        onChange={onBranchChange}
      />
      <DialInput
        labelProps={{ label: t(EntityFieldsI18nKey.SHA) }}
        id="SHA"
        placeholder={t(EntityPlaceholdersI18nKey.SHA)}
        value={image.source.sha}
        disabled={isReadOnlyAdmin}
        onChange={onSHAChange}
      />
    </div>
  );
};

export default Branch;
