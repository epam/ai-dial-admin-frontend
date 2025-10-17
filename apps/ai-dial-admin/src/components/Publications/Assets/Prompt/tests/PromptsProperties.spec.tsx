import { PublicationsI18nKey } from '@/src/constants/i18n';
import { ActionType } from '@/src/models/dial/publications';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PromptsProperties from '../PromptsProperties';

const basePrompt = {
  name: 'PromptName',
  version: '1.0',
  description: 'desc',
  content: 'Prompt content',
};

describe('PromptsProperties', () => {
  it('renders collapsed by default', () => {
    render(<PromptsProperties prompt={basePrompt} action={ActionType.ADD} collapsed={true} />);
    expect(screen.getByText('PromptName')).toBeInTheDocument();
  });

  it('expands and shows details when toggled', () => {
    render(<PromptsProperties prompt={basePrompt} action={ActionType.ADD} collapsed={true} />);
    fireEvent.click(screen.getByText('PromptName'));
    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
    expect(screen.getByText('Prompt content')).toBeInTheDocument();
  });

  it('shows open button for DELETE action', () => {
    render(<PromptsProperties prompt={basePrompt} action={ActionType.DELETE} collapsed={false} />);
    expect(screen.getByRole('button', { name: PublicationsI18nKey.OpenPrompt })).toBeInTheDocument();
  });

  it('calls onOpenInNewTab when open button is clicked', () => {
    render(<PromptsProperties prompt={basePrompt} action={ActionType.DELETE} collapsed={false} />);
    fireEvent.click(screen.getByRole('button', { name: PublicationsI18nKey.OpenPrompt }));
  });
});
