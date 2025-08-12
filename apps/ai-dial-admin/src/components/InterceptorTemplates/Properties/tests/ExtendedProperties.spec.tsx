import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import ExtendedProperties from '../ExtendedProperties';
import { CreateI18nKey } from '@/src/constants/i18n';

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

    expect(screen.getByRole('textbox', { name: CreateI18nKey.DisplayNameTitle })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.description.title (Optional)' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.completionEndpoint.title' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.configurationEndpoint.title' })).toBeInTheDocument();
  });
});
