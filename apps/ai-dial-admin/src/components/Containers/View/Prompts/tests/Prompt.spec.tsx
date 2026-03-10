import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Prompt from '../Prompt';
import { Prompt as PromptType } from '@/src/models/deployments/containers';

describe('Prompt', () => {
  const mockPrompt: PromptType = {
    name: 'Test Prompt',
    description: 'Test description',
    arguments: [{ name: 'arg1', description: 'Argument 1', required: true }],
  };

  test('renders prompt name', () => {
    render(<Prompt prompt={mockPrompt} />);

    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
  });
});
