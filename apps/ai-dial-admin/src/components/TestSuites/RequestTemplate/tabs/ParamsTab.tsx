import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';

import GridView from '@/src/components/Grid/GridView/GridView';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { getParamsColumns } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  TestSuiteRequestTemplate,
  TestSuiteRequestTemplateContent,
  TestSuiteRequestTemplateParam,
} from '@/src/models/evaluation/test-suite';

interface Props {
  template: TestSuiteRequestTemplate;
  changeTemplate: (template: TestSuiteRequestTemplate) => void;
  field: keyof Omit<TestSuiteRequestTemplateContent, 'urlTemplate' | 'body'>;
  title: string;
  emptyDataTitle: string;
}
const ParamsTab: FC<Props> = ({ template, changeTemplate, field, title, emptyDataTitle }) => {
  const t = useI18n();
  const [visibleIndex, setVisibleIndex] = useState<number | undefined>();
  const gridApi = useRef<GridApi>(null);
  const configRef = useRef(template.content?.[field] || []);

  const onAddParam = useCallback(() => {
    const fieldData = [...configRef.current];
    const lastIndex = gridApi.current?.getLastDisplayedRowIndex() as number;
    setVisibleIndex(lastIndex + 1);
    fieldData.push({ key: '', value: '' });
    changeTemplate({ ...template, content: { ...template.content, [field]: fieldData } });
  }, [changeTemplate, template, field]);

  const onRemoveParam = useCallback(
    (_data?: TestSuiteRequestTemplate, index?: number | null) => {
      if (index != null) {
        const fieldData = [...configRef.current];
        fieldData.splice(index, 1);
        setVisibleIndex(index - 1);
        changeTemplate({ ...template, content: { ...template.content, [field]: fieldData } });
      }
    },
    [template, changeTemplate, field],
  );

  const onChangeValue = useCallback(
    (value: string, _data: TestSuiteRequestTemplateParam, key: string, rowIndex?: number) => {
      if (rowIndex != null) {
        const fieldData = [...configRef.current];
        fieldData[rowIndex][key as keyof TestSuiteRequestTemplateParam] = value;
        changeTemplate({ ...template, content: { ...template.content, [field]: fieldData } });
      }
    },
    [template, changeTemplate, field],
  );

  const columnDefs: ColDef[] = [
    ...getParamsColumns(onChangeValue),
    ONE_ACTION_COLUMN(getRemoveOperation(onRemoveParam, void 0, 'text-error w-4 h-4')),
  ];
  const rowData = template.content?.[field] || [];

  const onGridReady = (event: GridReadyEvent) => {
    gridApi.current = event.api;

    event.api?.updateGridOptions({
      columnDefs,
      rowData,
    });
  };

  useEffect(() => {
    configRef.current = template.content?.[field] || [];
  }, [field, template]);

  useEffect(() => {
    gridApi.current?.updateGridOptions({
      rowData: template.content?.[field],
    });
    if (visibleIndex != null) {
      gridApi.current?.ensureIndexVisible(visibleIndex, 'bottom');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.content?.[field]?.length, gridApi]);

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      <div className="flex flex-row justify-between items-center">
        <h3>
          {title}: {template.content?.[field]?.length || 0}
        </h3>
        <DialGhostButton iconBefore={<IconPlus />} label={t(ButtonsI18nKey.Add)} onClick={() => onAddParam()} />
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <GridView
          getIsEmptyData={() => !template.content?.[field]?.length}
          emptyDataProps={{ title: emptyDataTitle }}
          onGridReady={onGridReady}
        />
      </div>
    </div>
  );
};

export default ParamsTab;
