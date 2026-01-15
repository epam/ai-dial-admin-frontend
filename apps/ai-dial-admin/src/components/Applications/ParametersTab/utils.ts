import { SelectOption } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams, ITooltipParams } from 'ag-grid-community';

import { DefaultItemType } from '@/src/components/Defaults/types';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import JsonEditorCellRenderer from '@/src/components/Grid/CellRenderers/JsonEditorCellRenderer';
import SelectCellRenderer from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { NO_BORDER_CLASS } from '@/src/constants/ag-grid';
import { BasicI18nKey, EntitiesI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { UserSession } from '@/src/models/auth';
import {
  ApplicationPropertiesTemp,
  DialApplication,
  DialApplicationScheme,
  TypeEntity,
} from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialSchemePropertyType } from '@/src/models/dial/scheme';
import { ParamsFields, ParamsView } from '@/src/types/parameters';
import { ApplicationRoute } from '@/src/types/routes';

export const getFrameConfig = (
  scheme: DialApplicationScheme | DialApplicationResource,
  currentTheme: string,
  session?: UserSession,
) => {
  return {
    theme: currentTheme,
    providerId: session?.providerId,
    host:
      (scheme as DialApplicationScheme)?.['dial:applicationTypeEditorUrl'] ||
      (scheme as DialApplicationResource)?.editorUrl,
    name:
      (scheme as DialApplicationScheme)?.['dial:applicationTypeDisplayName'] ||
      (scheme as DialApplicationResource)?.name,
  };
};

export const getAppRunner = (
  entity: DialApplication | AssetApp,
  applicationSchemes?: DialApplicationScheme[] | null,
): DialApplicationScheme | undefined => {
  if (!applicationSchemes) return entity as DialApplicationScheme;

  return applicationSchemes?.find((scheme) => {
    const appTypeSchemaId = (entity as AssetApp)?.applicationTypeSchemaId;
    const customAppSchemaId = entity?.customAppSchemaId;
    const editorUrl = entity?.editorUrl;

    return (
      (scheme.$id && appTypeSchemaId && scheme.$id === appTypeSchemaId) ||
      (scheme.$id && customAppSchemaId && scheme.$id === customAppSchemaId) ||
      (scheme['dial:applicationTypeEditorUrl'] && editorUrl && scheme['dial:applicationTypeEditorUrl'] === editorUrl)
    );
  });
};

export const getInitialParamsView = (route?: ApplicationRoute, uiExist?: boolean): ParamsView => {
  if (route === ApplicationRoute.ApplicationPublications || route === ApplicationRoute.ApplicationRunners) {
    return ParamsView.FORM;
  }
  if (uiExist) {
    return ParamsView.UI;
  }
  return ParamsView.TABLE;
};

export const generateViewItems = (
  t: (s: string) => string,
  route?: ApplicationRoute,
  showUi?: boolean,
  showForm?: boolean,
): SelectOption[] => {
  if (route === ApplicationRoute.ApplicationPublications || route === ApplicationRoute.ApplicationRunners) {
    return [];
  }
  const items: SelectOption[] = [
    {
      value: ParamsView.TABLE,
      label: t(EntitiesI18nKey[ParamsView.TABLE]),
    },
  ];

  if (showForm) {
    items.push({
      value: ParamsView.FORM,
      label: t(EntitiesI18nKey[ParamsView.FORM]),
    });
  }

  if (showUi) {
    items.push({
      value: ParamsView.UI,
      label: t(EntitiesI18nKey[ParamsView.UI]),
    });
  }

  return items;
};
//todo support multiple types from scheme
export const convertJsonSchema = (
  schema: DialApplicationScheme,
  schemeData: Record<string, DefaultsValue>,
): ApplicationPropertiesTemp[] => {
  const result = [];

  for (const key in schema.properties) {
    const value = schema.properties[key];

    const isRequired = schema.required && schema.required.includes(key);

    let typeValue = TypeEntity.OBJECT as string;

    if (value.anyOf) {
      typeValue = getTypeFromUnion(value.anyOf);
    } else if (value.oneOf) {
      typeValue = getTypeFromUnion(value.oneOf);
    } else if (value.type) {
      if (value.type === TypeEntity.ARRAY) {
        typeValue = TypeEntity.OBJECT;
      } else {
        typeValue = value.type;
      }
    }

    result.push({
      key,
      value: schemeData[key],
      type: typeValue,
      required: isRequired || false,
      isFromScheme: true,
    });
  }

  return result;
};

export const getTypeFromUnion = (types: DialSchemePropertyType[]): string => {
  const typesSet = new Set<string>();

  types.forEach((typeOption) => {
    if (typeOption.type === TypeEntity.ARRAY) {
      typesSet.add(TypeEntity.OBJECT);
    } else if (typeOption.type === TypeEntity.BOOLEAN) {
      typesSet.add(TypeEntity.BOOLEAN);
    } else if (typeOption.type === TypeEntity.STRING) {
      typesSet.add(TypeEntity.STRING);
    } else if (typeOption.type === TypeEntity.NUMBER) {
      typesSet.add(TypeEntity.NUMBER);
    } else if (typeOption.type === TypeEntity.NULL) {
      typesSet.add(TypeEntity.NULL);
    } else if (typeOption.$ref) {
      typesSet.add(TypeEntity.OBJECT);
    }
  });

  if (typesSet.has(TypeEntity.NULL)) {
    typesSet.delete(TypeEntity.NULL);
  }

  if (typesSet.size === 1) {
    return [...typesSet][0];
  }

  return TypeEntity.OBJECT;
};

export const convertAppPropertiesToArray = (
  properties: Record<string, DefaultsValue>,
  schemeProperties: ApplicationPropertiesTemp[] = [],
) => {
  const mergedSchema = [...schemeProperties];

  for (const [key, value] of Object.entries(properties)) {
    const existingProperty = mergedSchema.find((item) => item.key === key);

    const type = typeof value;

    if (existingProperty) {
      existingProperty.value = value;
    } else {
      mergedSchema.push({
        key,
        type,
        value,
        required: false,
        isFromScheme: false,
      });
    }
  }

  mergedSchema.sort((a, b) => {
    if (a.isFromScheme === b.isFromScheme) {
      return 0;
    }
    return a.isFromScheme ? -1 : 1;
  });

  return mergedSchema;
};

export const getAppPropertiesColumns = (
  onChangeEditable: (value: string, data: ApplicationPropertiesTemp, column: string, index?: number) => void,
  onChangeJSON: (value: object, data: ApplicationPropertiesTemp, column: string, index?: number) => void,
  onChangeSelect: (value: string, data: ApplicationPropertiesTemp, column: string) => void,
  t: (stringToTranslate: string) => string,
): ColDef[] => {
  return [
    {
      headerName: 'Key',
      field: ParamsFields.KEY,
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams) => {
        if (!params.data.isFromScheme) {
          return { component: EditableCellRenderer };
        } else {
          return void 0;
        }
      },
      cellRendererParams: {
        hideTriangle: true,
        onChange: onChangeEditable,
      },
      cellDataType: 'text',
      flex: 1,
      maxWidth: 240,
    },
    {
      headerName: 'Value',
      field: ParamsFields.VALUE,
      cellClass: NO_BORDER_CLASS,
      cellRendererSelector: (params: ICellRendererParams) => {
        if (params.data.type == 'object') {
          return {
            component: JsonEditorCellRenderer,
            params: {
              onChange: onChangeJSON,
              disableValidation: true,
            },
          };
        } else if (params.data.type == 'boolean') {
          return {
            component: SelectCellRenderer,
            params: {
              items: [
                {
                  value: 'true',
                  label: 'True',
                },
                {
                  value: 'false',
                  label: 'False',
                },
              ],
              onChange: onChangeSelect,
            },
          };
        } else {
          return {
            component: EditableCellRenderer,
            params: { inputType: params.data.type === 'string' ? 'text' : 'number', onChange: onChangeEditable },
          };
        }
      },
      tooltipValueGetter: (params: ITooltipParams) => {
        if (params.data.type === TypeEntity.OBJECT || params.data.type === TypeEntity.BOOLEAN) {
          return void 0;
        }
        return params.value;
      },
      cellRendererParams: {
        hideTriangle: true,
      },
      flex: 2,
    },
    {
      headerName: 'Type',
      field: ParamsFields.TYPE,
      cellClass: NO_BORDER_CLASS,
      cellRenderer: SelectCellRenderer,
      cellRendererParams: {
        getItems: (data: ApplicationPropertiesTemp) => {
          const items: SelectOption[] = [
            {
              value: DefaultItemType.string,
              label: t(TypeI18nKey.String),
            },
            {
              value: DefaultItemType.number,
              label: t(TypeI18nKey.Number),
            },
            {
              value: DefaultItemType.boolean,
              label: t(TypeI18nKey.Boolean),
            },
            {
              value: DefaultItemType.object,
              label: t(TypeI18nKey.Object),
            },
          ];
          return data.isFromScheme ? items.filter((i) => i.value === data.type) : items;
        },
        onChange: onChangeSelect,
      },
      flex: 1,
      maxWidth: 240,
    },
    {
      headerName: 'Required',
      field: ParamsFields.REQUIRED,
      cellClass: NO_BORDER_CLASS,
      valueFormatter: ({ value }) => formatRequired(value, t),
      tooltipValueGetter: ({ value }) => formatRequired(value, t),
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      cellDataType: false,
    },
  ];
};

const formatRequired = (value: string, t: (stringToTranslate: string) => string) => {
  return value ? t(BasicI18nKey.Yes) : t(BasicI18nKey.No);
};

export const validateAppProperties = (properties: ApplicationPropertiesTemp[]): boolean => {
  return !properties.some((p) => p.required && !p.value);
};
