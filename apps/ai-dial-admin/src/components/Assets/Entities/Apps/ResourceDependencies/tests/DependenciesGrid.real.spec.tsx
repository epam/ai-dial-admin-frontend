import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ResourceDependenciesI18nKey } from '@/src/constants/i18n';
import { ResourceAccess } from '@/src/models/dial/resource-dependency';
import DependenciesGrid from '../DependenciesGrid';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn(() => false) }));

describe('DependenciesGrid — real grid', () => {
  test('renders the column headers and a row for each dependency', async () => {
    render(
      <DependenciesGrid
        dependencies={[
          {
            kind: 'dial.resourceLink',
            link_id: 'docs',
            target: { path: 'files/public/folder/' },
            access: [ResourceAccess.Read],
            required: true,
          },
        ]}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(await screen.findByText('docs')).toBeTruthy();
    expect(screen.getByText('files/public/folder/')).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: ResourceDependenciesI18nKey.LinkId })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: ResourceDependenciesI18nKey.TargetPath })).toBeTruthy();
  });
});
