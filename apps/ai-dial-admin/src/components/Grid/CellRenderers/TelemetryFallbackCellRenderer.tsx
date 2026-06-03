import { FC } from 'react';
import { ICellRendererParams } from 'ag-grid-community';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';

interface Props extends ICellRendererParams {
  tooltip?: string;
}

const TelemetryFallbackCellRenderer: FC<Props> = ({ value, valueFormatted, tooltip }) => {
  const missing = !value || value === 'undefined';
  const label = valueFormatted ?? value;

  return (
    <div className="flex items-center gap-2">
      <span className="truncate">{label}</span>
      {missing && tooltip && (
        <DialTooltip tooltip={tooltip}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" aria-label={tooltip} />
        </DialTooltip>
      )}
    </div>
  );
};

export default TelemetryFallbackCellRenderer;
