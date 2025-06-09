import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { Publication } from '@/src/models/dial/publications';
import { publicationPrompt } from '@/src/utils/tests/mock/publication.mock';
import FilesProperties from '@/src/components/PublicationView/FileProperties/FilesProperties';

const mockWindowOpen = jest.fn();

describe('Components - FilesProperties', () => {
  beforeAll(() => {
    global.window.open = mockWindowOpen;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should correctly render', () => {
    const { getByTestId } = renderWithContext(<FilesProperties publication={publicationPrompt as Publication} />);

    const view = getByTestId('publication-file-view');
    expect(view).toBeTruthy();
  });
});
