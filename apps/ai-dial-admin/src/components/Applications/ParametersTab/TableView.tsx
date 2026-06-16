import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridReadyEvent, IRowNode } from 'ag-grid-community';

import { DefaultItemType } from '@/src/components/Defaults/types';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BooleanType } from '@/src/types/boolean';
import { ParamsFields } from '@/src/types/parameters';
import { ApplicationPropertyRow } from './models';
import { getAppPropertiesColumns, inferTypeFromValue } from './utils';

interface Props {
  applicationProperties: Record<string, unknown>;
  schemeProperties: ApplicationPropertyRow[];
  onChangeProperties: (properties: Record<string, unknown>) => void;
  onValidityChange: (isValid: boolean) => void;
  isAddClicked: boolean;
  setIsAddClicked: Dispatch<SetStateAction<boolean>>;
  disabled?: boolean;
}

const TableView: FC<Props> = ({
  applicationProperties,
  schemeProperties,
  onChangeProperties,
  onValidityChange,
  isAddClicked,
  setIsAddClicked,
  disabled,
}) => {
  const t = useI18n();
  const [gridApi, setGridApi] = useState<GridApi>();
  const [orderedUserKeys, setOrderedUserKeys] = useState<string[]>(() =>
    Object.keys(applicationProperties).filter((k) => !schemeProperties.some((s) => s.key === k)),
  );

  const appPropsRef = useRef(applicationProperties);
  const orderedKeysRef = useRef(orderedUserKeys);
  const schemePropsRef = useRef(schemeProperties);
  const isSkipRefreshRef = useRef(false);

  useEffect(() => {
    appPropsRef.current = applicationProperties;
  }, [applicationProperties]);

  useEffect(() => {
    orderedKeysRef.current = orderedUserKeys;
  }, [orderedUserKeys]);

  useEffect(() => {
    schemePropsRef.current = schemeProperties;
  }, [schemeProperties]);

  const rows = useMemo((): ApplicationPropertyRow[] => {
    const schemeRows = schemeProperties.map((s) => ({
      key: s.key,
      value: applicationProperties[s.key] !== undefined ? applicationProperties[s.key] : s.value,
      type: s.type,
      required: s.required,
      isFromScheme: true,
    }));

    const userRows = orderedUserKeys.map((key) => ({
      key,
      value: key !== '' ? applicationProperties[key] : '',
      type: key !== '' ? inferTypeFromValue(applicationProperties[key]) : DefaultItemType.string,
      required: false,
      isFromScheme: false,
    }));

    return [...schemeRows, ...userRows];
  }, [schemeProperties, orderedUserKeys, applicationProperties]);

  const onValidityChangeRef = useRef(onValidityChange);

  useEffect(() => {
    onValidityChangeRef.current = onValidityChange;
  }, [onValidityChange]);

  useEffect(() => {
    onValidityChange(!orderedUserKeys.includes(''));
  }, [orderedUserKeys, onValidityChange]);

  const validateKey = useCallback(
    (newValue: string, currentValue: string): string | null => {
      if (!newValue) {
        onValidityChangeRef.current(false);
        return t(BasicI18nKey.KeyRequired);
      }
      if (newValue !== currentValue) {
        const schemeKeys = schemePropsRef.current.map((s) => s.key);
        const otherUserKeys = orderedKeysRef.current.filter((k) => k !== currentValue);
        if ([...schemeKeys, ...otherUserKeys].includes(newValue)) {
          onValidityChangeRef.current(false);
          return t(BasicI18nKey.KeyDuplicate);
        }
      }
      onValidityChangeRef.current(!orderedKeysRef.current.includes(''));
      return null;
    },
    [t],
  );

  const onBlurKey = useCallback(
    (value: string, _data: unknown, _column: string, index?: number) => {
      const schemeCount = schemePropsRef.current.length;
      const userRowIndex = (index as number) - schemeCount;
      const currentKey = orderedKeysRef.current[userRowIndex];

      if (currentKey === value) return;

      const props = { ...appPropsRef.current };
      if (currentKey !== '') {
        const existingValue = props[currentKey];
        delete props[currentKey];
        props[value] = existingValue;
      } else {
        props[value] = '';
      }

      const newKeys = [...orderedKeysRef.current];
      newKeys[userRowIndex] = value;
      setOrderedUserKeys(newKeys);
      onChangeProperties(props);
    },
    [onChangeProperties],
  );

  const onChangeParam = useCallback(
    (value: string, _data: ApplicationPropertyRow, _field: string, index?: number) => {
      const allKeys = [...schemePropsRef.current.map((s) => s.key), ...orderedKeysRef.current];
      const key = allKeys[index as number];
      if (!key) return;

      const props = { ...appPropsRef.current };
      const currentType = inferTypeFromValue(props[key]);
      props[key] = currentType === DefaultItemType.number && value !== '' ? +value : value;
      isSkipRefreshRef.current = true;
      onChangeProperties(props);
    },
    [onChangeProperties],
  );

  const onChangeJSON = useCallback(
    (value: object, _data: ApplicationPropertyRow, _field: string, index?: number) => {
      const allKeys = [...schemePropsRef.current.map((s) => s.key), ...orderedKeysRef.current];
      const key = allKeys[index as number];
      if (!key) return;

      const props = { ...appPropsRef.current };
      props[key] = value;
      isSkipRefreshRef.current = true;
      onChangeProperties(props);
    },
    [onChangeProperties],
  );

  const onChangeSelect = useCallback(
    (value: string, _data: unknown, field?: string, index?: number) => {
      const allKeys = [...schemePropsRef.current.map((s) => s.key), ...orderedKeysRef.current];
      const key = allKeys[index as number];
      if (!key) return;

      const props = { ...appPropsRef.current };
      if (field === ParamsFields.VALUE) {
        if (inferTypeFromValue(props[key]) === DefaultItemType.boolean) {
          props[key] = value === BooleanType.true;
        }
      }
      if (field === ParamsFields.TYPE) {
        if (value === DefaultItemType.number) props[key] = 0;
        else if (value === DefaultItemType.boolean) props[key] = false;
        else if (value === DefaultItemType.object) props[key] = {};
        else props[key] = '';
      }
      onChangeProperties(props);
    },
    [onChangeProperties],
  );

  const onAddProperty = useCallback(() => {
    if (orderedKeysRef.current.includes('')) return;
    setOrderedUserKeys((prev) => [...prev, '']);
  }, []);

  const onRemoveProperty = useCallback(
    (_data?: ApplicationPropertyRow, index?: number) => {
      const schemeCount = schemePropsRef.current.length;
      const userRowIndex = (index as number) - schemeCount;
      const keyToRemove = orderedKeysRef.current[userRowIndex];

      const newKeys = [...orderedKeysRef.current];
      newKeys.splice(userRowIndex, 1);
      setOrderedUserKeys(newKeys);

      if (keyToRemove !== '') {
        const props = { ...appPropsRef.current };
        delete props[keyToRemove];
        onChangeProperties(props);
      }
    },
    [onChangeProperties],
  );

  const isRemoveHidden = useCallback((_api: GridApi, node: IRowNode) => {
    return node.data.isFromScheme;
  }, []);

  const columns = useMemo(() => {
    const dataColumns = getAppPropertiesColumns(
      onBlurKey,
      validateKey,
      onChangeParam,
      onChangeJSON,
      onChangeSelect,
      t,
      !!disabled,
    );
    return disabled
      ? dataColumns
      : [
          ...dataColumns,
          ACTION_COLUMN([getRemoveOperation(onRemoveProperty, (api, node) => isRemoveHidden(api, node))], true),
        ];
  }, [
    isRemoveHidden,
    onBlurKey,
    validateKey,
    onChangeJSON,
    onChangeParam,
    onChangeSelect,
    onRemoveProperty,
    disabled,
    t,
  ]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({
      columnDefs: columns,
      rowData: rows,
    });
  };

  useEffect(() => {
    if (!isSkipRefreshRef.current && !gridApi?.isDestroyed()) {
      gridApi?.updateGridOptions({
        columnDefs: columns,
        rowData: rows,
      });
    }
    isSkipRefreshRef.current = false;
  }, [columns, rows, gridApi]);

  useEffect(() => {
    if (isAddClicked) {
      onAddProperty();
      setIsAddClicked(false);
    }
  });

  return (
    <GridView
      getIsEmptyData={() => !rows.length}
      emptyDataProps={{ title: t(BasicI18nKey.NoParameters) }}
      onGridReady={onGridReady}
    />
  );
};

export default TableView;
