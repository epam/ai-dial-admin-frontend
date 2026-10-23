import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialApplicationResource } from '@/src/models/dial/resource';
import ResourceFeatures from '../ResourceFeatures';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

const mockUseAssetRunnerDetails = vi.hoisted(() => vi.fn());

vi.mock('@/src/components/Assets/Platform/use-asset-runner-details', () => ({
  useAssetRunnerDetails: mockUseAssetRunnerDetails,
}));

vi.mock('@/src/components/BaseControls/Endpoint/Endpoint', () => ({ default: () => null }));
vi.mock('@/src/components/EntityTabs/Features/ReasoningEffortsInput', () => ({ default: () => null }));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Label: ({ label }: any) => <span>{label}</span>,
  Spinner: () => null,
  TooltipPlacement: { Bottom: 'bottom' },
  Tooltip: ({ children }: any) => <div role="group">{children}</div>,
  Switch: ({ labelProps, isOn, onChange, disabled, id }: any) => (
    <input
      type="checkbox"
      role="switch"
      aria-label={labelProps?.label}
      id={id}
      checked={!!isOn}
      disabled={disabled}
      onChange={() => onChange(!isOn)}
    />
  ),
}));

describe('ResourceFeatures', () => {
  beforeEach(() => {
    mockUseAssetRunnerDetails.mockReturnValue({ features: undefined, isLoading: false });
  });

  test('inherits the assistant attachments switch from a runner resolved by schema id', () => {
    mockUseAssetRunnerDetails.mockReturnValue({
      features: { 'dial:applicationTypeAssistantAttachmentsInRequestSupported': true },
      isLoading: false,
    });
    render(
      <ResourceFeatures
        entity={{ features: {}, application_type_schema_id: 'runner-id' } as DialApplicationResource}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(mockUseAssetRunnerDetails).toHaveBeenCalledWith(undefined, 'runner-id');
    const toggle = screen.getByRole('switch', { name: 'Features.assistantAttachmentsInRequestSupported' });
    expect(toggle).toBeDisabled();
    expect(toggle).toBeChecked();
  });

  test('lays each switch group out without stretching its switches', () => {
    render(<ResourceFeatures entity={{ features: {} } as DialApplicationResource} onChangeEntity={vi.fn()} />);

    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThan(0);
    groups.forEach((group) => expect(group.parentElement).toHaveClass('items-start'));
  });

  test('renders a switch inside every tooltip group', () => {
    render(<ResourceFeatures entity={{ features: {} } as DialApplicationResource} onChangeEntity={vi.fn()} />);

    expect(screen.getAllByRole('switch')).toHaveLength(screen.getAllByRole('group').length);
  });
});
