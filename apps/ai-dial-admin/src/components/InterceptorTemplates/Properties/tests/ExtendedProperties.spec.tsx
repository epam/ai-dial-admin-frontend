import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import ExtendedProperties from '../ExtendedProperties';
import { CreateI18nKey, EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';

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
    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.description} (Optional)` })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.completionEndpoint} (Optional)` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: `${FeaturesI18nKey.configurationEndpoint} (Optional)` }),
    ).toBeInTheDocument();
  });
});
