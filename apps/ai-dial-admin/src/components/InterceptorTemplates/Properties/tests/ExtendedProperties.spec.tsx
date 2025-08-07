import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import ExtendedProperties from '../ExtendedProperties';

describe('Interceptor Template ExtendedProperties', () => {
  test('Should render BaseProperties and SourceField with External Endpoints', () => {
    const template: InterceptorTemplate = {
      name: 'test-template',
      displayName: 'Test Template',
      description: 'Test description',
      completionEndpoint: 'https://example.com/completion',
      configurationEndpoint: 'https://example.com/configuration',
    };
    const onChangeMock = vi.fn();

    render(<ExtendedProperties template={template} onChange={onChangeMock} />);

    expect(screen.getByRole('textbox', { name: 'CreateEntity.id.title' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.name.title' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.description.title (Optional)' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.completionEndpoint.title' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.configurationEndpoint.title' })).toBeInTheDocument();
  });
});
