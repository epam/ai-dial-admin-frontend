'use client';

import { FC } from 'react';
import { DialGhostButton, DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ImageVersion } from '@/src/models/deployments/images';
import { useI18n } from '@/src/locales/client';
import { getVersionsList } from '@/src/utils/deployments/images';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  versions: ImageVersion[];
  selected: string;
  onChange: (id: string) => void;
  onClick?: () => void;
  variant?: SelectVariant;
}

const VersionsSelect: FC<Props> = ({ onChange, versions, selected, variant = SelectVariant.Secondary, onClick }) => {
  const t = useI18n();

  if (!versions.length) {
    return null;
  }

  return (
    <DialSelect
      options={getVersionsList(versions)}
      variant={variant}
      size={SelectSize.Sm}
      value={selected}
      className="px-2"
      onChange={(id) => {
        onChange?.(id as string);
      }}
      footer={
        onClick && (
          <DialGhostButton
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
