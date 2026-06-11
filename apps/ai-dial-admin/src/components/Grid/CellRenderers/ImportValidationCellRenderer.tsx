import { ICellRendererParams } from 'ag-grid-community';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { RowImportMeta } from '@/src/models/deployments/import';
import { ValidationState } from '@/src/types/deployments/import';
import { formatValidationLine } from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';

const ImportValidationCellRenderer = (params: ICellRendererParams) => {
  const t = useI18n();
  const meta = params.data?.[ROW_IMPORT_META_KEY] as RowImportMeta | undefined;

  if (!meta) return null;

  const isFailed = meta.validationState === ValidationState.FAILED;
  const label = isFailed ? t(BasicI18nKey.Failed) : t(BasicI18nKey.Validated);
  const StateIcon = isFailed ? IconX : IconCheck;

  return (
    <div className="flex items-center gap-2 py-3 px-2 w-full">
      <DialTooltip triggerClassName="grow" tooltip={label}>
        <div className="flex items-center gap-2">
          <StateIcon {...BASE_BUTTON_ICON_PROPS} className={isFailed ? 'text-error' : 'text-success'} />
          <div>{label}</div>
        </div>
      </DialTooltip>
      {isFailed && (
        <DialTooltip
          tooltip={
            <div className="flex flex-col gap-1">
              {meta.validationErrors.map((e, i) => (
                <div key={i}>{formatValidationLine(e)}</div>
              ))}
            </div>
          }
        >
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} className="text-secondary" aria-label={label} />
        </DialTooltip>
      )}
    </div>
  );
};

export default ImportValidationCellRenderer;
