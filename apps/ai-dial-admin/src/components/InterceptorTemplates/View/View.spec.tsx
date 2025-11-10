import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import { ButtonsI18nKey, EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import View from './View';

const template: InterceptorTemplate = {
  name: 'test-template',
  displayName: 'Test Template',
  description: 'Test description',
  completionEndpoint: 'https://example.com/completion',
  configurationEndpoint: 'https://example.com/configuration',
};

describe('View', () => {
  test('Should render correctly', () => {
    render(<View etag="qqqq" names={[]} template={template} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
    const completion = screen.getByText(EntityFieldsI18nKey.completionEndpoint);
    expect(completion).toBeInTheDocument();
    expect(completion.parentElement).toHaveAttribute('for', 'completionEndpoint');
    const configuration = screen.getByText(FeaturesI18nKey.configurationEndpoint);
    expect(configuration).toBeInTheDocument();
    expect(configuration.parentElement).toHaveAttribute('for', 'configurationEndpoint');
  });
});
