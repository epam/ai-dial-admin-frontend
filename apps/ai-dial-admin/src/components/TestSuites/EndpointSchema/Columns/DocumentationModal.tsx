import { FC, useMemo } from 'react';

import {
  ButtonAppearance,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  ElementSize,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';
import { IconExternalLink } from '@tabler/icons-react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { JsonAtaI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GRID_SECTIONS, RESOURCE_LINKS } from './constants';
import { DocumentationRow } from './types';

const DOCUMENTATION_GRID_OPTIONS = {
  domLayout: 'autoHeight' as const,
  suppressHorizontalScroll: true,
};

interface Props {
  schema: JSONSchema7;
  isModalOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: FC<Props> = ({ schema, isModalOpen, onClose }) => {
  const t = useI18n();

  const onOpenInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const columnDefs: ColDef<DocumentationRow>[] = useMemo(
    () => [
      {
        field: 'useCase',
        headerName: t(JsonAtaI18nKey.UseCase),
        flex: 1,
        minWidth: 120,
        sortable: false,
        filter: false,
        floatingFilter: false,
      },
      {
        field: 'expression',
        headerName: t(JsonAtaI18nKey.Expression),
        flex: 2,
        minWidth: 180,
        sortable: false,
        filter: false,
        floatingFilter: false,
      },
      {
        field: 'resultType',
        headerName: t(JsonAtaI18nKey.ResultType),
        flex: 1,
        minWidth: 100,
        sortable: false,
        filter: false,
        floatingFilter: false,
      },
    ],
    [t],
  );

  const sections = useMemo(
    () =>
      GRID_SECTIONS.map((section) => ({
        titleKey: section.titleKey,
        rowData: section.buildRows(schema),
      })),
    [schema],
  );

  return (
    <DialPopup
      onClose={onClose}
      header={t(JsonAtaI18nKey.JSONAtaDoc)}
      portalId="JSONAtaDocumentationModal"
      open={isModalOpen}
      size={PopupSize.Md}
      className="h-[800px]"
      dividers={true}
    >
      <div className="h-full px-6 py-4 flex flex-col">
        <div className="flex flex-row items-center justify-between">
          <span className="body text-secondary">{t(JsonAtaI18nKey.JsonAtaDescription)}</span>
          <DialNeutralButton
            size={ElementSize.Small}
            label={t(JsonAtaI18nKey.OpenFullDoc)}
            iconBefore={<IconExternalLink size={14} />}
            onClick={() => onOpenInNewTab('https://docs.jsonata.org/overview.html')}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto flex flex-col gap-4 py-4">
          {sections.map(({ titleKey, rowData }) => (
            <div key={titleKey} className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-primary">{t(titleKey)}</span>
              <GridView<DocumentationRow>
                columnDefs={columnDefs}
                rowData={rowData}
                getIsEmptyData={() => rowData.length === 0}
                emptyDataProps={{ title: 'No matching fields in schema' }}
                additionalGridOptions={DOCUMENTATION_GRID_OPTIONS}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm">{t(JsonAtaI18nKey.MoreResources)}</div>
          <div className="flex flex-row items-center gap-3 justify-center">
            {RESOURCE_LINKS.map(({ labelKey, url }) => (
              <DialPrimaryButton
                key={url}
                iconBefore={<IconExternalLink size={14} />}
                size={ElementSize.Small}
                appearance={ButtonAppearance.Ghost}
                label={t(labelKey)}
                onClick={() => onOpenInNewTab(url)}
              />
            ))}
          </div>
        </div>
      </div>
    </DialPopup>
  );
};

export default DocumentationModal;
