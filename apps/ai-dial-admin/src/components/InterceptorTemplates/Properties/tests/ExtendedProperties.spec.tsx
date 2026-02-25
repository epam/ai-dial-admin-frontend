import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ExtendedProperties from '../ExtendedProperties';

vi.mock('@/src/components/InterceptorTemplates/Properties/BaseProperties', () => ({
  default: ({ template, onChangeTemplate, isImmutable }: any) => (
    <section aria-label="base-properties">
      <div>name:{template?.name}</div>
      <div>immutable:{String(isImmutable)}</div>
      <button type="button" onClick={() => onChangeTemplate({ ...template, description: 'base-updated' })}>
        Change base
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/CompletionEndpoint', () => ({
  default: ({ endpoint, onChange }: any) => (
    <section aria-label="completion-endpoint-control">
      <div>completion:{endpoint}</div>
      <button type="button" onClick={() => onChange('https://new-completion.endpoint')}>
        Change completion endpoint
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl', () => ({
  default: ({ endpoint, onChange }: any) => (
    <section aria-label="configuration-endpoint-control">
      <div>configuration:{endpoint}</div>
      <button type="button" onClick={() => onChange('https://new-configuration.endpoint')}>
        Change configuration endpoint
      </button>
    </section>
  ),
}));

vi.mock('@/src/components/BaseControls/Topics', () => ({
  default: ({ entity, onChange }: any) => (
    <section aria-label="topics-control">
      <div>topics:{(entity?.topics || []).length}</div>
      <button type="button" onClick={() => onChange({ ...entity, topics: ['topic-a'] })}>
        Change topics
      </button>
    </section>
  ),
}));

describe('InterceptorTemplates :: ExtendedProperties', () => {
  const template = {
    name: 'template-1',
    description: 'desc',
    completionEndpoint: 'https://completion.endpoint',
    configurationEndpoint: 'https://configuration.endpoint',
    topics: ['old-topic'],
  } as any;

  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onChange = vi.fn();
  });

  test('renders all sections and passes immutable mode to base properties', () => {
    render(<ExtendedProperties template={template} onChange={onChange} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'base-properties' })).toHaveTextContent('immutable:true');
    expect(screen.getByRole('region', { name: 'completion-endpoint-control' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'configuration-endpoint-control' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'topics-control' })).toBeInTheDocument();
  });

  test('forwards base properties changes through onChange', () => {
    render(<ExtendedProperties template={template} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change base' }));

    expect(onChange).toHaveBeenCalledWith({
      ...template,
      description: 'base-updated',
    });
  });

  test('updates completion endpoint through callback', () => {
    render(<ExtendedProperties template={template} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change completion endpoint' }));

    expect(onChange).toHaveBeenCalledWith({
      ...template,
      completionEndpoint: 'https://new-completion.endpoint',
    });
  });

  test('updates configuration endpoint through callback', () => {
    render(<ExtendedProperties template={template} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change configuration endpoint' }));

    expect(onChange).toHaveBeenCalledWith({
      ...template,
      configurationEndpoint: 'https://new-configuration.endpoint',
    });
  });

  test('forwards topics changes through onChange', () => {
    render(<ExtendedProperties template={template} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Change topics' }));

    expect(onChange).toHaveBeenCalledWith({
      ...template,
      topics: ['topic-a'],
    });
  });
});
