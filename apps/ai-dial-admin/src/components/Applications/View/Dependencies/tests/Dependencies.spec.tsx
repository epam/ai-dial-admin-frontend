import { render } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import Dependencies from '@/src/components/Applications/View/Dependencies/Dependencies';
import DisplayNameCellRenderer from '@/src/components/Grid/CellRenderers/DisplayNameCellRenderer';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplication } from '@/src/models/dial/application';
import { DialModel } from '@/src/models/dial/model';

const { gridProps } = vi.hoisted(() => ({ gridProps: { columnDefs: [] as ColDef[] } }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { columnDefs: ColDef[] }) => {
    gridProps.columnDefs = props.columnDefs;
    return null;
  },
}));

describe('Dependencies', () => {
  test('links each dependency name to its model or application page in a new tab', () => {
    render(
      <Dependencies
        application={{ name: 'host', dependencies: ['gpt-4', 'helper'] } as DialApplication}
        applications={[{ name: 'helper' } as DialApplication]}
        models={[{ name: 'gpt-4' } as DialModel]}
        onChange={vi.fn()}
      />,
    );

    const nameColumn = gridProps.columnDefs.find((column) => column.cellRenderer === DisplayNameCellRenderer);
    const params = nameColumn?.cellRendererParams as { getHref: (row: unknown) => string; isNewTab: boolean };

    expect(params.isNewTab).toBe(true);
    expect(params.getHref({ name: 'gpt-4', type: MenuI18nKey.Models })).toBe('/models/gpt-4');
    expect(params.getHref({ name: 'helper', type: MenuI18nKey.Applications })).toBe('/applications/helper');
  });
});
