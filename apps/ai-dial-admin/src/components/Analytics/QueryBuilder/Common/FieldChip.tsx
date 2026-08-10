import { FC } from 'react';

import classNames from 'classnames';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { QUERY_BUILDER_PALETTE } from '@/src/constants/analytics/query-builder-palette';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryBuilderColor } from '@/src/models/analytics/query-builder';

interface Props {
  label: string;
  onRemove: () => void;
  // The field does not resolve against the loaded schema. One appearance, one wording, whatever the
  // cause — see the unavailable-field banner.
  unavailable?: boolean;
  unavailableHint?: string;
}

const CHIP = QUERY_BUILDER_PALETTE[QueryBuilderColor.Dimension];

const FieldChip: FC<Props> = ({ label, onRemove, unavailable, unavailableHint }) => {
  const t = useI18n();

  return (
    <span
      className={classNames(
        'inline-flex max-w-full items-center gap-1.5 rounded px-2 py-1 font-mono dial-tiny-text',
        unavailable ? 'border border-dashed border-warning text-secondary' : classNames(CHIP.chipBg, CHIP.chipText),
      )}
    >
      {unavailable && (
        <DialTooltip hideTooltip={!unavailableHint} tooltip={unavailableHint} contentClassName="max-w-[320px]">
          <IconAlertTriangle size={12} className="shrink-0 text-warning" />
        </DialTooltip>
      )}
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
