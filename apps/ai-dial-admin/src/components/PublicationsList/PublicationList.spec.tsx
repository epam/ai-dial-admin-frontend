import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import PromptsPublicationsList from '@/src/components/PublicationsPromptList/PublicationsPromptsList';
import { describe, expect, test } from 'vitest';

describe('Components - PublicationsPromptList', () => {
  test('Should correctly render PromptsList collapsed view', () => {
    const { getByTestId } = renderWithContext(<PromptsPublicationsList data={[publicationPrompt as Publication]} />);

    const publicationList = getByTestId('publication-list');
    expect(publicationList).toBeTruthy();
  });
});
