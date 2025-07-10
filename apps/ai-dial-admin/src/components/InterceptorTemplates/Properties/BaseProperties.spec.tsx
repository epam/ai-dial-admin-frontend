import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BaseProperties from './BaseProperties';

describe('Interceptor Template BaseProperties', () => {
  const template = {
    name: 'test-template',
    displayName: 'Test Template',
    description: 'desc',
  };
  const names = ['test-template', 'other-template'];

  test('Should render all important fields', () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} setTemplate={setTemplateMock} names={names} />);
    expect(screen.getByPlaceholderText('CreateEntity.id.placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('CreateEntity.name.placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('CreateEntity.description.placeholder')).toBeInTheDocument();
  });

  test('Should call setTemplate on id change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} setTemplate={setTemplateMock} names={names} />);
    const idInput = screen.getByPlaceholderText('CreateEntity.id.placeholder');
    await userEvent.clear(idInput);
    await userEvent.type(idInput, 'new-id');
    expect(setTemplateMock).toHaveBeenCalled();
  });

  test('Should call setTemplate on name change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} setTemplate={setTemplateMock} names={names} />);
    const nameInput = screen.getByPlaceholderText('CreateEntity.name.placeholder');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Name');
    expect(setTemplateMock).toHaveBeenCalled();
  });

  test('Should call setTemplate on description change', async () => {
    const setTemplateMock = vi.fn();
    render(<BaseProperties template={template} setTemplate={setTemplateMock} names={names} />);
    const descInput = screen.getByPlaceholderText('CreateEntity.description.placeholder');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'New Desc');
    expect(setTemplateMock).toHaveBeenCalled();
  });
});
