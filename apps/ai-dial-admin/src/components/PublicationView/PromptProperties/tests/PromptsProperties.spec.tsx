import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import PromptsProperties from '@/src/components/PublicationView/PromptProperties/PromptsProperties';
import { fireEvent } from '@testing-library/react';
import { ActionType } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

const mockWindowOpen = vi.fn();

describe('Components - PromptsProperties', () => {
  beforeAll(() => {
    global.window.open = mockWindowOpen;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('Should correctly render PromptsList collapsed view', () => {
    const { getByTestId } = renderWithContext(
      <PromptsProperties
        prompt={publicationPrompt.prompts[0]}
        collapsed={true}
        action={publicationPrompt.action as ActionType}
      />,
    );
    const view = getByTestId('publication-prompt-view');
    const content = getByTestId('publication-prompt-content');
    expect(view).toBeTruthy();
    expect(content.classList).toContain('hidden');
  });

  test('Should correctly render PromptsList not collapsed view', () => {
    const { getByTestId } = renderWithContext(
      <PromptsProperties
        prompt={publicationPrompt.prompts[0]}
        collapsed={false}
        action={publicationPrompt.action as ActionType}
      />,
    );
    const view = getByTestId('publication-prompt-view');
    const content = getByTestId('publication-prompt-content');
    expect(view).toBeTruthy();
    expect(content.classList).not.toContain('hidden');
  });

  test('Should correctly change collapsed state', () => {
    const { getByTestId } = renderWithContext(
      <PromptsProperties
        prompt={publicationPrompt.prompts[0]}
        collapsed={false}
        action={publicationPrompt.action as ActionType}
      />,
    );

    const content = getByTestId('publication-prompt-content');
    const collapseButton = getByTestId('publication-prompt-collapse-button');

    expect(content.classList).not.toContain('hidden');
    fireEvent.click(collapseButton);
    expect(content.classList).toContain('hidden');
  });

  test('Should correctly navigate to prompt', () => {
    const { getByTestId } = renderWithContext(
      <PromptsProperties prompt={publicationPrompt.prompts[0]} collapsed={false} action={'delete' as ActionType} />,
    );

    const openButton = getByTestId('publication-prompt-open-button');

    fireEvent.click(openButton);
    expect(mockWindowOpen).toHaveBeenCalled();
  });
});
