import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent, IRowNode } from 'ag-grid-community';

import { DefaultItemType } from '@/src/components/Defaults/types';
import { getValueByType } from '@/src/components/Defaults/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationPropertiesTemp } from '@/src/models/dial/application';
import { BooleanType } from '@/src/types/boolean';
import { ParamsFields } from '@/src/types/parameters';
import { getAppPropertiesColumns } from './utils';

interface Props {
  properties: ApplicationPropertiesTemp[];
  isSkipRefresh?: boolean;
  onChangeProperties: (properties: ApplicationPropertiesTemp[], isSkipRefresh?: boolean) => void;
  isAddClicked: boolean;
  setIsAddClicked: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
}

const TableView: FC<Props> = ({
  properties,
  isSkipRefresh,
  onChangeProperties,
  isAddClicked,
  setIsAddClicked,
  disabled,
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();
  const data = useMemo(() => properties, [properties]);
  const propRef = useRef(properties || []);

  const onChangeParam = useCallback(
    (value: string, _data: ApplicationPropertiesTemp, field: string, index?: number) => {
      const properties = [...propRef.current];
      const property = { ...properties[index as number] };

      if (value !== '' && field === ParamsFields.VALUE && property.type === DefaultItemType.number) {
        property.value = +value;
      } else {
        const key = field as keyof ApplicationPropertiesTemp;
        property[key] = value as never;
      }

      properties.splice(index as number, 1, property);
      onChangeProperties(properties, true);
    },
    [onChangeProperties],
  );

  const onChangeJSON = useCallback(
    (value: object, _data: ApplicationPropertiesTemp, _field: string, index?: number) => {
      const properties = [...propRef.current];
      const property = { ...properties[index as number] };
      property.value = value;
      properties.splice(index as number, 1, property);
      onChangeProperties(properties, true);
    },
    [onChangeProperties],
  );

  const onChangeSelect = useCallback(
    (value: string, _data: unknown, field?: string, index?: number) => {
      const properties = [...propRef.current];
      const property = { ...properties[index as number] };

      if (field === ParamsFields.VALUE) {
        if (property.type === DefaultItemType.boolean) {
          property.value = value === BooleanType.true;
        }
      }
      if (field === ParamsFields.TYPE) {
        if (property.type !== value) {
          property.type = value;
          property.value = getValueByType(value === DefaultItemType.boolean ? false : '', value);
        }
      }
      properties.splice(index as number, 1, property);
      onChangeProperties(properties);
    },
    [onChangeProperties],
  );

  const onAddProperty = useCallback(() => {
    const newProperty = {
      key: '',
      value: '',
      type: 'string',
      required: false,
      isFromScheme: false,
    };
    const appPropertiesTemp = [...propRef.current, newProperty];

    onChangeProperties(appPropertiesTemp, false);
  }, [onChangeProperties]);

  const onRemoveProperty = useCallback(
    (_data?: ApplicationPropertiesTemp, index?: number) => {
      const appPropertiesTemp = [...propRef.current];
      appPropertiesTemp.splice(index as number, 1);
      onChangeProperties(appPropertiesTemp, false);
    },
    [onChangeProperties],
  );

  const isRemoveHidden = useCallback((_api: GridApi, node: IRowNode) => {
    return node.data.isFromScheme;
  }, []);

  const columns = useMemo(() => {
    const dataColumns = getAppPropertiesColumns(onChangeParam, onChangeJSON, onChangeSelect, t, !!disabled);
    return disabled
      ? dataColumns
      : [
          ...dataColumns,
          ACTION_COLUMN([getRemoveOperation(onRemoveProperty, (api, node) => isRemoveHidden(api, node))], true),
        ];
  }, [isRemoveHidden, onChangeJSON, onChangeParam, onChangeSelect, onRemoveProperty, disabled, t]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: data,
    });
  };

  useEffect(() => {
    if (!isSkipRefresh && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columns,
        rowData: data,
      });
    }
  }, [isSkipRefresh, columns, data, gridApi]);

  useEffect(() => {
    propRef.current = properties || [];
  }, [properties]);

  useEffect(() => {
    if (isAddClicked) {
      onAddProperty();
      setIsAddClicked(false);
    }
  });

  return (
    <GridView
      getIsEmptyData={() => !properties.length}
      emptyDataProps={{ title: t(BasicI18nKey.NoParameters) }}
      onGridReady={onGridReady}
    />
  );
};

export default TableView;
