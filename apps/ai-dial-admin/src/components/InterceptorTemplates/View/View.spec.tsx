import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';

import View from './View';
import { ButtonsI18nKey, EntityFieldsI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';

const template: InterceptorTemplate = {
  name: 'test-template',
  displayName: 'Test Template',
  description: 'Test description',
  completionEndpoint: 'https://example.com/completion',
  configurationEndpoint: 'https://example.com/configuration',
};

describe('View', () => {
  it('Should render correctly', () => {
    render(<View route={ApplicationRoute.InterceptorTemplates} template={template} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.completionEndpoint} (Optional)` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: `${FeaturesI18nKey.configurationEndpoint} (Optional)` }),
    ).toBeInTheDocument();
  });
});
