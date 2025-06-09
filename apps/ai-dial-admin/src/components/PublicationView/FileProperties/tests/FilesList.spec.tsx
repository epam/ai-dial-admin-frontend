import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import FilesList from '@/src/components/PublicationView/FileProperties/FilesList';

describe('Components - FilesList', () => {
  it('Should correctly render PromptsList component', () => {
    const { getAllByTestId } = renderWithContext(<FilesList files={publicationPrompt?.files} />);

    const view = getAllByTestId('publication-files-list-grid');
    expect(view).toBeTruthy();
  });
});
