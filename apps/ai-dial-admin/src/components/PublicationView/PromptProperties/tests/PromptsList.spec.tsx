import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import PromptsList from '@/src/components/PublicationView/PromptProperties/PromptsList';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';

describe('Components - PromptsList', () => {
  it('Should correctly render PromptsList component', () => {
    const { getAllByTestId } = renderWithContext(<PromptsList publication={publicationPrompt as Publication} />);
    const view = getAllByTestId('publication-prompt-view');

    expect(view).toBeTruthy();
    expect(view.length).toBe(1);
  });
});
