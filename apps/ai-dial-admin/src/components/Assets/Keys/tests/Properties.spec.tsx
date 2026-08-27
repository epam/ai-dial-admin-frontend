import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, KeysI18nKey } from '@/src/constants/i18n';
import { DialKeyResource } from '@/src/models/dial/resource';
import KeyAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

// AccessRestrictionField has heavy internal state; mock it to isolate Properties behaviour.
vi.mock('@/src/components/Keys/View/Properties/AccessRestrictionField', () => ({
  default: ({ onChange }: { onChange?: (v?: string[]) => void }) => (
    <button onClick={() => onChange?.(['192.168.0.0/24'])}>AccessRestrictionField</button>
  ),
}));

const baseAsset: DialKeyResource = {
  name: 'my-key',
  path: 'my-key',
  folderId: '',
} as unknown as DialKeyResource;

const renderProperties = (asset: Partial<DialKeyResource> = {}, onChange = vi.fn()) =>
  render(<KeyAssetProperties asset={{ ...baseAsset, ...asset }} originalAsset={baseAsset} onChange={onChange} />);

describe('Key asset Properties', () => {
  test('Renders the project field', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.project)).toBeInTheDocument();
  });

  test('Renders the secured toggle', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.secured)).toBeInTheDocument();
  });

  test('Renders the access restriction field', () => {
    renderProperties();

    expect(screen.getByText('AccessRestrictionField')).toBeInTheDocument();
  });

  test('Calls onChange with the updated project value', () => {
    const onChange = vi.fn();
    renderProperties({ project: 'old-project' }, onChange);

    const input = screen.getByDisplayValue('old-project');
    fireEvent.change(input, { target: { value: 'new-project' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ project: 'new-project' }));
  });

  test('Calls onChange when the access restriction changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProperties({}, onChange);

    await user.click(screen.getByText('AccessRestrictionField'));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ allowedIpAddressRanges: ['192.168.0.0/24'] }));
  });

  test('Does not render a key value field — the secret is write-only', () => {
    renderProperties({ key: 'should-not-show' });

    expect(screen.queryByDisplayValue('should-not-show')).not.toBeInTheDocument();
  });
});
