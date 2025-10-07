import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';

import CompareVersions from '../CompareVersions';
import { DialPrompt } from '@/src/models/dial/prompt';

import * as actions from '@/src/app/[lang]/prompts/actions';

vi.mock('@/src/app/[lang]/prompts/actions', () => ({
  getPrompt: vi.fn(),
}));

describe('Common components - CompareVersions', () => {
  const user = userEvent.setup();
  const prompt = { content: 'content', name: 'name', version: '1.0.0' } as DialPrompt;
  const prompts = [
    { content: 'content', name: 'name', version: '1.0.0', author: 'John Doe' },
    { content: 'content 1', name: 'name 1', version: '1.0.1', author: 'John Doe' },
  ] as DialPrompt[];
  test('renders component correctly', () => {
    render(
      <CompareVersions
        heading="heading"
        prompts={prompts}
        prompt={prompt}
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Close })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'heading' })).toBeInTheDocument();
  });

  test('version change handled correctly', async () => {
    render(
      <CompareVersions
        heading="heading"
        prompts={prompts}
        prompt={prompt}
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
      />,
    );

    const dropdownItem = screen.getByRole('menuitem', { name: '1.0.0' });
    expect(dropdownItem).toBeInTheDocument();
    user.click(dropdownItem);

    await waitFor(async () => {
      const dropdownItem = screen.getByRole('menuitem', { name: '1.0.1' });
      expect(dropdownItem).toBeInTheDocument();

      user.click(dropdownItem);

      await waitFor(() => {
        expect(actions.getPrompt).toHaveBeenCalled();
      });
    });
  });
});
