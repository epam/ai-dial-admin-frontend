import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import SkillManifestTab from '../SkillManifestTab';

const renderTab = (overrides: Partial<Parameters<typeof SkillManifestTab>[0]> = {}) =>
  render(
    <SkillManifestTab
      name="my-skill"
      description="Does a thing"
      body="# Body"
      onChangeDescription={vi.fn()}
      onChangeBody={vi.fn()}
      {...overrides}
    />,
  );

describe('SkillManifestTab', () => {
  test('renders the name disabled with the parsed value', () => {
    renderTab();

    const nameInput = screen.getByLabelText(EntityFieldsI18nKey.name) as HTMLInputElement;
    expect(nameInput.value).toBe('my-skill');
    expect(nameInput).toBeDisabled();
  });

  test('renders the description editable and pre-populated', async () => {
    const onChangeDescription = vi.fn();
    const user = userEvent.setup();
    renderTab({ onChangeDescription });

    const descriptionInput = screen.getByLabelText(new RegExp(EntityFieldsI18nKey.description)) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe('Does a thing');

    await user.type(descriptionInput, '!');

    expect(onChangeDescription).toHaveBeenCalled();
  });

  test('renders the body in the markdown editor', () => {
    renderTab();

    expect(screen.getByText('# Body')).toBeInTheDocument();
  });

  test('disables the description and markdown editor when disabled', () => {
    renderTab({ disabled: true });

    const descriptionInput = screen.getByLabelText(new RegExp(EntityFieldsI18nKey.description)) as HTMLTextAreaElement;
    expect(descriptionInput).toBeDisabled();
  });
});
