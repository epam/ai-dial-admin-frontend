import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ApplicationRoute } from '@/src/types/routes';

import View from './View';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

const template: InterceptorTemplate = {
  name: 'test-template',
  displayName: 'Test Template',
  description: 'Test description',
  completionEndpoint: 'https://example.com/completion',
  configurationEndpoint: 'https://example.com/configuration',
};

describe('View', () => {
  it('Should render correctly', () => {
    render(
      <SaveValidationContextProvider>
        <View route={ApplicationRoute.InterceptorTemplates} template={template} />
      </SaveValidationContextProvider>,
    );

    expect(screen.getByRole('button', { name: 'Buttons.Delete' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'CreateEntity.completionEndpoint.title' })).toHaveValue(
      template.completionEndpoint,
    );
    expect(screen.getByRole('textbox', { name: 'CreateEntity.configurationEndpoint.title' })).toHaveValue(
      template.configurationEndpoint,
    );
  });
});
