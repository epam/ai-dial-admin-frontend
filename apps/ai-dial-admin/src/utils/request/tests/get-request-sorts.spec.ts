import { getRequestSorts } from '../get-request-sorts';
import { SortModelItem } from 'ag-grid-community';
import { SortDirectionDto } from '@/src/types/request';

describe('Request :: getRequestSorts', () => {
  it('should convert a single sort item to SortDto', () => {
    const input: SortModelItem[] = [{ colId: 'name', sort: 'asc' }];

    const expected = [{ column: 'name', direction: SortDirectionDto.ASC }];

    expect(getRequestSorts(input)).toEqual(expected);
  });

  it('should convert multiple sort items to SortDto array', () => {
    const input: SortModelItem[] = [
      { colId: 'name', sort: 'asc' },
      { colId: 'age', sort: 'desc' },
    ];

    const expected = [
      { column: 'name', direction: SortDirectionDto.ASC },
      { column: 'age', direction: SortDirectionDto.DESC },
    ];

    expect(getRequestSorts(input)).toEqual(expected);
  });

  it('should return an empty array when sortModel is empty', () => {
    expect(getRequestSorts([])).toEqual([]);
  });
});
