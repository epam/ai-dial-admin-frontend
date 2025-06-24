import PublicationProperties from '@/src/components/PublicationView/PublicationProperties';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test } from 'vitest';

describe('Components - BasePublicationProperties', () => {
  test('Should correctly render BasePublicationProperties component', () => {
    const { getByTestId } = renderWithContext(
      <PublicationProperties
        view={ApplicationRoute.PromptPublications}
        publication={publicationPrompt as Publication}
      />,
    );
    const header = getByTestId('publication-header');
    const content = getByTestId('publication-content');
    const view = getByTestId('publication-prompt-view');

    expect(header).toBeTruthy();
    expect(content).toBeTruthy();
    expect(view).toBeTruthy();
  });

  test('Should not render BasePublicationProperties component if view is incorrect', () => {
    const { container } = renderWithContext(
      <PublicationProperties view={ApplicationRoute.Home} publication={publicationPrompt as Publication} />,
    );

    expect(container.innerHTML).toBeFalsy();
  });
});
