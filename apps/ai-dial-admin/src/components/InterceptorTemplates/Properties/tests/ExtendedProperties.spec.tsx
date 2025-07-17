import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

import ExtendedProperties from '../ExtendedProperties';

describe('Interceptor Template ExtendedProperties', () => {
  test('Should render BaseProperties and SourceField with External Endpoints', () => {
    const template: InterceptorTemplate = {
      name: 'test-template',
      displayName: 'Test Template',
      description: 'Test description',
      source: SOURCE_TYPE.EXTERNAL_ENDPOINT,
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
    expect(screen.getByRole('menuitem', { name: 'External Endpoint' })).toBeInTheDocument();
  });

  test('Should render BaseProperties and SourceField with Interceptor Container', () => {
    const template: InterceptorTemplate = {
      name: 'test-template',
      displayName: 'Test Template',
      description: 'Test description',
      source: SOURCE_TYPE.INTERCEPTOR_CONTAINER,
      interceptorContainerId: 'container1',
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
    expect(screen.getByRole('menuitem', { name: 'Interceptor Container' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'open-popup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open container' })).toBeInTheDocument();
  });
});
