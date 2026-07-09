import { FC, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';
import { DialPopup, DialSwitch, PopupSize } from '@epam/ai-dial-ui-kit';

import GridView from '@/src/components/Grid/GridView/GridView';
import { TypeCellRenderer } from '@/src/components/Analytics/Common/TypeBadge';
import { family } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SchemaPreviewRow } from '@/src/models/analytics/query-builder';

interface Props {
  open: boolean;
  onClose: () => void;
  entityName: string;
  fields: AnalyticsEntityField[];
}

const SchemaPreviewPopup: FC<Props> = ({ open, onClose, entityName, fields }) => {
  const t = useI18n();
  const [showJson, setShowJson] = useState(false);

  const rows: SchemaPreviewRow[] = useMemo(
    () =>
      fields.map((f) => ({
        field: f.name,
        type: f.type,
        family: family(f.name),
        source: f.source,
        tag: f.tag || '—',
      })),
    [fields],
  );

  const columns: ColDef<SchemaPreviewRow>[] = useMemo(
    () => [
      { headerName: t(QueryBuilderI18nKey.SchemaGridField), field: 'field', flex: 2 },
      { headerName: t(QueryBuilderI18nKey.SchemaGridType), field: 'type', flex: 1, cellRenderer: TypeCellRenderer },
      { headerName: t(QueryBuilderI18nKey.SchemaGridFamily), field: 'family', flex: 1 },
      { headerName: t(QueryBuilderI18nKey.SchemaGridSource), field: 'source', flex: 2 },
      { headerName: t(QueryBuilderI18nKey.SchemaGridTag), field: 'tag', flex: 1 },
    ],
    [t],
  );

  return (
    <DialPopup
      open={open}
      onClose={onClose}
      portalId="qb-schema-preview"
      size={PopupSize.Lg}
      header={`${t(QueryBuilderI18nKey.SchemaPreview)}: ${entityName}`}
    >
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-center justify-end">
          <DialSwitch
            switchId="qb-schema-json"
            label={t(QueryBuilderI18nKey.ViewJson)}
            isOn={showJson}
            onChange={setShowJson}
          />
        </div>

        {showJson ? (
          <pre className="max-h-[60vh] overflow-auto rounded border border-primary bg-layer-1 p-4 font-mono dial-tiny-text">
            {JSON.stringify({ fields }, null, 2)}
          </pre>
        ) : (
          <div className="h-[60vh]">
            <GridView columnDefs={columns as ColDef[]} rowData={rows} />
          </div>
        )}
      </div>
    </DialPopup>
  );
};

export default SchemaPreviewPopup;
