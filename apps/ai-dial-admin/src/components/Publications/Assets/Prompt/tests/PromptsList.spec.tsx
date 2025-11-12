import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PromptsPropertiesList from '../PromptsPropertiesList';

describe('PromptsPropertiesList', () => {
  test('renders a list of PromptsProperties for each prompt', () => {
    const publication = {
      prompts: [{ name: 'Prompt1' }, { name: 'Prompt2' }],
      action: 'UPDATE',
      content: 'content',
    };
    render(<PromptsPropertiesList publication={publication as any} />);
    expect(screen.getByText('Prompt1')).toBeInTheDocument();
    expect(screen.getByText('Prompt2')).toBeInTheDocument();
  });

  test('renders nothing if no prompts', () => {
    const publication = { prompts: [], action: 'UPDATE' };
    const { container } = render(<PromptsPropertiesList publication={publication as any} />);
    expect(container).toBeEmptyDOMElement();
  });
});
