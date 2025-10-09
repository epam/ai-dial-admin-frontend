import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import ExtendedProperties from '../ExtendedProperties';
import { BasicI18nKey, EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';

describe('Interceptor Template ExtendedProperties', () => {
  test('Should render BaseProperties and SourceField with External InterceptorEndpoint', () => {
    const template: InterceptorTemplate = {
      name: 'test-template',
      displayName: 'Test Template',
      description: 'Test description',
      completionEndpoint: 'https://example.com/completion',
      configurationEndpoint: 'https://example.com/configuration',
    };
    const onChangeMock = vi.fn();

    render(<ExtendedProperties template={template} onChange={onChangeMock} />);

    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.displayName })).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
    const completion = screen.getByText(EntityFieldsI18nKey.completionEndpoint);
    expect(completion).toBeInTheDocument();
    expect(completion.parentElement).toHaveAttribute('for', 'completionEndpoint');
    const configuration = screen.getByText(FeaturesI18nKey.configurationEndpoint);
    expect(configuration).toBeInTheDocument();
    expect(configuration.parentElement).toHaveAttribute('for', 'configurationEndpoint');
  });
});
