import FilesList from '@/src/components/PublicationView/FileProperties/FilesList';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test } from 'vitest';

describe('Components - FilesList', () => {
  test('Should correctly render PromptsList component', () => {
    const { getAllByTestId } = renderWithContext(<FilesList files={publicationPrompt?.files} />);

    const view = getAllByTestId('publication-files-list-grid');
    expect(view).toBeTruthy();
  });
});
