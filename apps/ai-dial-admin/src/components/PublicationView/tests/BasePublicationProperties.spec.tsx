import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { Publication } from '@/src/models/dial/publications';
import BasePublicationProperties from '@/src/components/PublicationView/BasePublicationProperties';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { describe, expect, test } from 'vitest';

describe('Components - BasePublicationProperties', () => {
  test('Should correctly render BasePublicationProperties component', () => {
    const { getByTestId } = renderWithContext(
      <BasePublicationProperties publication={publicationPrompt as Publication}>
        <></>
      </BasePublicationProperties>,
    );
    const header = getByTestId('publication-header');
    const content = getByTestId('publication-content');

    expect(header).toBeTruthy();
    expect(content).toBeTruthy();
  });
});
