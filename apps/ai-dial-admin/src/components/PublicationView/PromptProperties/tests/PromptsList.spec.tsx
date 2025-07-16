import { render } from '@testing-library/react';
import PromptsPropertiesList from '@/src/components/PublicationView/PromptProperties/PromptsPropertiesList';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { describe, expect, test } from 'vitest';

describe('Components - PromptsList', () => {
  test('Should correctly render PromptsList component', () => {
    const { getAllByTestId } = render(<PromptsPropertiesList publication={publicationPrompt as Publication} />);
    const view = getAllByTestId('publication-prompt-view');

    expect(view).toBeTruthy();
    expect(view.length).toBe(1);
  });
});
