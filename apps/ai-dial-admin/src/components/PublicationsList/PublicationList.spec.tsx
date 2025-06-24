import { render } from '@testing-library/react';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import PromptsPublicationsList from '@/src/components/PublicationsPromptList/PublicationsPromptsList';
import { describe, expect, test } from 'vitest';

describe('Components - PublicationsPromptList', () => {
  test('Should correctly render PromptsList collapsed view', () => {
    const { getByTestId } = render(<PromptsPublicationsList data={[publicationPrompt as Publication]} />);

    const publicationList = getByTestId('publication-list');
    expect(publicationList).toBeTruthy();
  });
});
