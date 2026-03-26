import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import Properties from '../Properties';

vi.mock('@/src/components/BaseControls/Id/Id', () => ({
  default: ({ entity, onChangeEntity }: any) => (
    <section aria-label="id-control">
      <div>id:{entity?.name}</div>
      <button type="button" onClick={() => onChangeEntity({ name: 'runner-updated' })}>
        Change id
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: ({ displayName, onChange }: any) => (
    <section aria-label="display-name-control">
      <div>display-name:{displayName}</div>
      <button type="button" onClick={() => onChange('Updated display')}>
        Change display name
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/Description', () => ({
  default: ({ entity, onChangeEntity }: any) => (
    <section aria-label="description-control">
      <div>description:{entity?.description}</div>
      <button type="button" onClick={() => onChangeEntity({ ...entity, description: 'Updated description' })}>
        Change description
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/CompletionEndpoint', () => ({
  default: ({ endpoint, onChange }: any) => (
    <section aria-label="completion-endpoint-control">
      <div>endpoint:{endpoint}</div>
      <button type="button" onClick={() => onChange('https://updated.endpoint')}>
        Change endpoint
      </button>
    </section>
  ),
}));

vi.mock('../ExtendedProperties', () => ({
  default: ({ runner }: any) => <section aria-label="extended-properties">extended:{runner?.$id}</section>,
}));

describe('ApplicationRunners :: ConfigurationView :: Properties', () => {
  const baseRunner = {
    $id: 'runner-1',
    description: 'Initial description',
    'dial:applicationTypeDisplayName': 'Initial display',
    'dial:applicationTypeCompletionEndpoint': 'https://initial.endpoint',
  } as any;

  const names = ['runner-1', 'runner-2'];
  let onChangeRunner: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onChangeRunner = vi.fn();
  });

  test('renders editable controls when runner is mutable', () => {
    render(<Properties names={names} runner={baseRunner} onChangeRunner={onChangeRunner} />);

    expect(screen.getByRole('region', { name: 'id-control' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'display-name-control' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'description-control' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'extended-properties' })).not.toBeInTheDocument();
  });

  test('renders immutable mode with extended properties only for immutable-specific sections', () => {
    render(<Properties names={names} runner={baseRunner} isImmutable={true} onChangeRunner={onChangeRunner} />);

    expect(screen.queryByRole('region', { name: 'id-control' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'completion-endpoint-control' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'extended-properties' })).toHaveTextContent('extended:runner-1');
    expect(screen.getByRole('region', { name: 'display-name-control' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'description-control' })).toBeInTheDocument();
  });

  test('updates runner id via IdControl callback', () => {
    render(<Properties names={names} runner={baseRunner} onChangeRunner={onChangeRunner} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change id' }));

    expect(onChangeRunner).toHaveBeenCalledWith({
      ...baseRunner,
      $id: 'runner-updated',
    });
  });

  test('updates display name via DisplayNameControl callback', () => {
    render(<Properties names={names} runner={baseRunner} onChangeRunner={onChangeRunner} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change display name' }));

    expect(onChangeRunner).toHaveBeenCalledWith({
      ...baseRunner,
      'dial:applicationTypeDisplayName': 'Updated display',
    });
  });

  test('updates description via DescriptionControl callback', () => {
    render(<Properties names={names} runner={baseRunner} onChangeRunner={onChangeRunner} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change description' }));

    expect(onChangeRunner).toHaveBeenCalledWith({
      ...baseRunner,
      description: 'Updated description',
    });
  });
});
