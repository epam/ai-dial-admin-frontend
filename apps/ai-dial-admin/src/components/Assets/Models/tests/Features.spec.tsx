import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FeaturesI18nKey } from '@/src/constants/i18n';
import { DialModelResource, DialModelResourceStatus } from '@/src/models/dial/resource';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import ModelResourceFeatures from '../Features';
import { modelResourceFeatureLabelMap, modelResourceSwitchGroups, modelResourceTextFeatures } from '../constants';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLabel: ({ label }: any) => <span>{label}</span>,
  DialSwitch: ({ label, isOn, onChange, disabled, switchId }: any) => (
    <label>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        id={switchId}
        checked={!!isOn}
        disabled={disabled}
        onChange={() => onChange(!isOn)}
      />
    </label>
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/Endpoint', () => ({
  default: ({ id, label, endpoint, onChange }: any) => (
    <input aria-label={label} id={id} value={endpoint || ''} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/src/components/EntityTabs/Features/ReasoningEffortsInput', () => ({
  default: ({ values, onChange }: any) => (
    <button aria-label="reasoning-efforts" onClick={() => onChange([...(values ?? []), 'high'])}>
      {(values ?? []).join(',')}
    </button>
  ),
}));

const baseEntity: DialModelResource = {
  name: 'gpt-4',
  path: 'gpt-4',
  folderId: '',
  status: DialModelResourceStatus.Valid,
} as DialModelResource;

describe('ModelResourceFeatures', () => {
  test('renders an endpoint control for every model text feature', () => {
    render(<ModelResourceFeatures entity={baseEntity} onChangeEntity={vi.fn()} />);

    modelResourceTextFeatures.forEach((key) => {
      expect(screen.getByLabelText(modelResourceFeatureLabelMap[key])).toBeInTheDocument();
    });
  });

  test('renders the caching switch group, with no consent_required switch (application-only feature)', () => {
    render(<ModelResourceFeatures entity={baseEntity} onChangeEntity={vi.fn()} />);

    expect(screen.getByText(FeaturesI18nKey.GroupCaching)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: modelResourceFeatureLabelMap.cache_supported })).toBeInTheDocument();
    expect(
      screen.getByRole('switch', { name: modelResourceFeatureLabelMap.auto_caching_supported }),
    ).toBeInTheDocument();

    const totalSwitches = modelResourceSwitchGroups.reduce((sum, group) => sum + group.keys.length, 0);
    expect(screen.getAllByRole('switch')).toHaveLength(totalSwitches);
  });

  test('reflects existing feature values on the switches', () => {
    const entity: DialModelResource = {
      ...baseEntity,
      features: { cache_supported: true } as DialModelResource['features'],
    };

    render(<ModelResourceFeatures entity={entity} onChangeEntity={vi.fn()} />);

    expect(screen.getByRole('switch', { name: modelResourceFeatureLabelMap.cache_supported })).toBeChecked();
    expect(screen.getByRole('switch', { name: modelResourceFeatureLabelMap.tools_supported })).not.toBeChecked();
  });

  test('toggling a switch calls onChangeEntity with the updated feature, preserving other features', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    const entity: DialModelResource = {
      ...baseEntity,
      features: { tools_supported: true } as DialModelResource['features'],
    };

    render(<ModelResourceFeatures entity={entity} onChangeEntity={onChangeEntity} />);

    await user.click(screen.getByRole('switch', { name: modelResourceFeatureLabelMap.cache_supported }));

    expect(onChangeEntity).toHaveBeenCalledWith({
      ...entity,
      features: { tools_supported: true, cache_supported: true },
    });
  });

  test('editing a text feature calls onChangeEntity with the updated endpoint', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();

    render(<ModelResourceFeatures entity={baseEntity} onChangeEntity={onChangeEntity} />);

    await user.type(screen.getByLabelText(modelResourceFeatureLabelMap.rate_endpoint), 'a');

    expect(onChangeEntity).toHaveBeenCalledWith({
      ...baseEntity,
      features: { rate_endpoint: 'a' },
    });
  });

  test('reasoning efforts input reflects existing values and propagates additions', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    const entity: DialModelResource = {
      ...baseEntity,
      features: { reasoning_efforts: ['low'] } as DialModelResource['features'],
    };

    render(<ModelResourceFeatures entity={entity} onChangeEntity={onChangeEntity} />);

    expect(screen.getByRole('button', { name: 'reasoning-efforts' })).toHaveTextContent('low');

    await user.click(screen.getByRole('button', { name: 'reasoning-efforts' }));

    expect(onChangeEntity).toHaveBeenCalledWith({
      ...entity,
      features: { reasoning_efforts: ['low', 'high'] },
    });
  });

  test('disables switches for a read-only admin', () => {
    (useIsReadOnlyAdmin as any).mockReturnValue(true);

    render(<ModelResourceFeatures entity={baseEntity} onChangeEntity={vi.fn()} />);

    expect(screen.getByRole('switch', { name: modelResourceFeatureLabelMap.cache_supported })).toBeDisabled();

    (useIsReadOnlyAdmin as any).mockReturnValue(false);
  });
});
