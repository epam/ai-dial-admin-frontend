'use client';

import { FC } from 'react';

import classNames from 'classnames';
import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconCheck } from '@tabler/icons-react';

import SensitiveIndicator from '@/src/components/Common/SensitiveIndicator/SensitiveIndicator';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FieldOption } from '@/src/models/analytics/query-builder';

interface Props {
  option: FieldOption;
  selected: boolean;
  onPick: () => void;
}

const FieldDropdownOption: FC<Props> = ({ option, selected, onPick }) => {
  const t = useI18n();

  // One row-level tooltip carries both the sensitive note (when sensitive) and the full description;
  // the dot renders without its own tooltip so they don't nest.
  const tooltip = [option.sensitive && t(AnalyticsTablesI18nKey.Sensitive), option.description]
    .filter(Boolean)
    .join(' — ');

  return (
    <DialTooltip hideTooltip={!tooltip} tooltip={tooltip} triggerClassName="w-full" contentClassName="max-w-[320px]">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        // The left gutter is always reserved so the check mark can sit beside the name without
        // shifting the row — a tint alone is easy to miss and is a colour-only cue.
        className={classNames(
          'relative flex w-full flex-col gap-0.5 rounded py-1.5 pl-6 pr-2 text-left hover:bg-layer-4',
          // Last so a hovered selected row still reads as selected.
          selected && 'bg-accent-primary-alpha hover:bg-accent-primary-alpha',
        )}
        onClick={onPick}
      >
        {selected && (
          <IconCheck aria-hidden size={12} className="absolute left-1.5 top-2 shrink-0 text-accent-primary" />
        )}
        <span className="flex w-full items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-mono dial-tiny-text text-primary">{option.display_name || option.name}</span>
            {option.sensitive && <SensitiveIndicator />}
          </span>
          {option.type && <span className="shrink-0 dial-tiny-text text-secondary">{option.type}</span>}
        </span>
        {option.description && (
          <span className="w-full truncate dial-tiny-text text-secondary">{option.description}</span>
        )}
      </button>
    </DialTooltip>
  );
};

export default FieldDropdownOption;
