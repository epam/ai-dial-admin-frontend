import { FC } from 'react';

import classNames from 'classnames';
import { IconX } from '@tabler/icons-react';

import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

interface Props {
  label: string;
  onRemove: () => void;
}

const CHIP = QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension];

const FieldChip: FC<Props> = ({ label, onRemove }) => {
  const t = useI18n();

  return (
    <span
      className={classNames(
        'inline-flex max-w-full items-center gap-1.5 rounded px-2 py-1 font-mono dial-tiny-text',
        CHIP.chipBg,
        CHIP.chipText,
      )}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        aria-label={`${t(ButtonsI18nKey.Remove)} ${label}`}
        className="shrink-0 opacity-70 hover:opacity-100"
        onClick={onRemove}
      >
        <IconX size={14} />
      </button>
    </span>
  );
};

export default FieldChip;
