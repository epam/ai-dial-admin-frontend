import { DialPrompt } from '@/src/models/dial/prompt';
import { FileManagerColumnKey, NAME_COLUMN, SelectOption, UPDATED_AT_COLUMN } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';
import SelectCellRenderer, { SelectCellRendererParams } from '@/src/components/Grid/CellRenderers/SelectCellRenderer';
import { STRINGS_DELIMITER } from '@/src/constants/prompt';

export const getItems = (data: unknown) => {
  const prompt = data as DialPrompt;
  return prompt?.versions?.map((v) => ({ value: v, label: v })) as SelectOption[];
};

export const getPromptGridColumns = (
  onChange: (
    value: string | string[],
    data: unknown,
    column?: string | undefined,
    index?: number | undefined,
    isSelected?: boolean | undefined,
  ) => void,
  selectedVersionsMap: Record<string, string[]>,
) => {
  const AUTHOR_COLUMN = {
    colId: FileManagerColumnKey.Author,
    field: 'author',
    headerName: 'Author',
    width: 200,
    suppressSizeToFit: true,
  };

  const VERSION_COLUMN = {
    colId: FileManagerColumnKey.Version,
    field: 'version',
    headerName: 'Version',
    width: 200,
    suppressSizeToFit: true,
    cellRenderer: (params: SelectCellRendererParams & { data: DialPrompt }) => {
      if (params.data?.versions) {
        const customSelectedVersions = selectedVersionsMap?.[`${params.data.folderId}${params.data.name}`];
        const selectValue = customSelectedVersions
          ? customSelectedVersions.join(STRINGS_DELIMITER)
          : params.data.selectedVersions.join(STRINGS_DELIMITER);
        return (
          <SelectCellRenderer
            {...params}
            data={params.data}
            value={selectValue}
            isMulti
            getItems={getItems}
            onChange={onChange}
          />
        );
      } else {
        return null;
      }
    },
  };

  return [
    NAME_COLUMN('Display name') as ColDef,
    VERSION_COLUMN,
    AUTHOR_COLUMN,
    UPDATED_AT_COLUMN('Updated time') as ColDef,
  ];
};

export const getAllSelectedItemsPaths = (basePath: string, selectedVersions: Record<string, string[]>): string[] => {
  const prefix = basePath.substring(0, basePath.lastIndexOf('__'));
  const versions = selectedVersions?.[prefix];

  return versions ? versions.map((v) => `${prefix}__${v}`) : [basePath];
};
