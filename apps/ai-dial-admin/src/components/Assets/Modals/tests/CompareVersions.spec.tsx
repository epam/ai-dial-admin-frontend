import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DialPrompt } from '@/src/models/dial/prompt';
import CompareVersions from '../CompareVersions';

vi.mock('@/src/app/[lang]/prompts/actions', () => ({
  getPrompt: vi.fn(() => {
    response: {
    }
  }),
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
      <CompareVersions heading="heading" prompts={prompts} prompt={prompt} isModalOpen={true} onClose={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'heading' })).toBeInTheDocument();
  });

  test('version change handled correctly', async () => {
    render(
      <CompareVersions heading="heading" prompts={prompts} prompt={prompt} isModalOpen={true} onClose={vi.fn()} />,
    );

    const dropdownItem = screen.getByText('Compare.Version 1.0.0');
    expect(dropdownItem).toBeInTheDocument();
    user.click(dropdownItem);
  });
});
