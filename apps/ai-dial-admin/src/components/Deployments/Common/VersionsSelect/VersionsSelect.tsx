'use client';

import { FC } from 'react';
import { GhostButton, Select, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { getVersionsList } from '@/src/utils/deployments/images';
import { ButtonsI18nKey, CompareI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  versions: ImageVersion[];
  selected: string;
  onChange: (id: string) => void;
  onClick?: () => void;
}

const VersionsSelect: FC<Props> = ({ onChange, versions, selected, onClick }) => {
  const t = useI18n();

  if (!versions.length) {
    return null;
  }

  return (
    <Select
      ariaLabel={t(CompareI18nKey.Version)}
      options={getVersionsList(versions)}
      size={ElementSize.Small}
      value={selected}
      className="px-2"
      onChange={(id) => {
        onChange?.(id as string);
      }}
      header={
        onClick && (
          <GhostButton
            className="rounded-none"
            label={t(ButtonsI18nKey.Create)}
            onClick={onClick}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          />
        )
      }
    />
  );
};

export default VersionsSelect;
