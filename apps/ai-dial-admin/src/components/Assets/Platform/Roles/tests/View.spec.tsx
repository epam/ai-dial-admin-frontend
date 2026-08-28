import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateRole } from '@/src/app/[lang]/platform-roles/actions';
import { DialRoleResource } from '@/src/models/dial/resource';
import RoleAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-roles/actions', () => ({
  updateRole: vi.fn().mockResolvedValue({ success: true }),
  removeRole: vi.fn(),
  getRoles: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave }: any) => (
    <button type="button" onClick={onSave}>
      save
    </button>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const role = (overrides: Partial<DialRoleResource> = {}): DialRoleResource =>
  ({
    name: 'my-role',
    path: 'my-role',
    folderId: '',
    ...overrides,
  }) as DialRoleResource;

const clickSave = async (entity: DialRoleResource) => {
  const user = userEvent.setup();
  render(<RoleAssetView etag="etag" originalRole={entity} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('RoleAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send the role to Core with its etag on save', async () => {
    await clickSave(role());

    expect(updateRole).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-role' }), 'etag');
  });

  test('Should render the tabs content', () => {
    render(<RoleAssetView etag="etag" originalRole={role()} />);

    expect(screen.getByText('tabs-content')).toBeInTheDocument();
  });
});
