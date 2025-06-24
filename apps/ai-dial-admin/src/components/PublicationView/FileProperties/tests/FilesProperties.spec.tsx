import FilesProperties from '@/src/components/PublicationView/FileProperties/FilesProperties';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import { render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

const mockWindowOpen = vi.fn();

describe('Components - FilesProperties', () => {
  beforeAll(() => {
    global.window.open = mockWindowOpen;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('Should correctly render', () => {
    const { getByTestId } = render(<FilesProperties publication={publicationPrompt as Publication} />);

    const view = getByTestId('publication-file-view');
    expect(view).toBeTruthy();
  });
});
