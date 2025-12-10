import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import BaseProperties from '../BaseProperties';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

describe('Interceptor Template BaseProperties', () => {
  const template: InterceptorTemplate = {
    name: 'test-template',
    displayName: 'Test Template',
    description: 'Test description',
    completionEndpoint: 'https://example.com/completion',
    configurationEndpoint: 'https://example.com/configuration',
  };
  const names = ['test-template', 'other-template'];

  test('Should render all important fields', () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} onChangeTemplate={setTemplateMock} names={names} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description)).toBeInTheDocument();
  });

  test('Should call setTemplate on id change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} onChangeTemplate={setTemplateMock} names={names} />);
    const idInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id);
    await userEvent.clear(idInput);
    await userEvent.type(idInput, 'new-id');
    expect(setTemplateMock).toHaveBeenCalled();
  });

  test('Should call setTemplate on name change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} onChangeTemplate={setTemplateMock} names={names} />);
    const nameInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');
    expect(setTemplateMock).toHaveBeenCalled();
  });

  test('Should call setTemplate on description change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} onChangeTemplate={setTemplateMock} names={names} />);
    const descInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description);
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'New Desc');
    expect(setTemplateMock).toHaveBeenCalled();
  });
});
