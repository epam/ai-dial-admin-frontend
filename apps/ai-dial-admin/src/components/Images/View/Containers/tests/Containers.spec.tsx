import { render } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getImageContainers } from '@/src/app/actions/deployments';
import LinkCellRenderer from '@/src/components/Grid/CellRenderers/LinkCellRenderer';
import Containers from '@/src/components/Images/View/Containers/Containers';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/actions/deployments');

let capturedColumns: ColDef[] | undefined;

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ columnDefs }: { columnDefs: ColDef[] }) => {
    capturedColumns = columnDefs;
    return null;
  },
}));

describe('Containers (image tab)', () => {
  beforeEach(() => {
    capturedColumns = undefined;
    vi.mocked(getImageContainers).mockResolvedValue({ success: true, response: [] } as never);
  });

  test('links each container name to its container page in a new tab', () => {
    render(
      <Containers
        image={{ id: 'img-1', $type: IMAGE_TYPE.MCP } as Image}
        route={ApplicationRoute.Images}
        versions={[]}
      />,
    );

    const nameColumn = capturedColumns?.find((column) => column.field === 'displayName');
    const params = nameColumn?.cellRendererParams as { getHref: (row: unknown) => string; isNewTab: boolean };

    expect(nameColumn?.cellRenderer).toBe(LinkCellRenderer);
    expect(params.isNewTab).toBe(true);
    expect(params.getHref({ name: 'mcp-1' })).toBe('/containers/mcp-1');
  });
});
