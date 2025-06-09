import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import BasePublicationPermissions from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationPermissions';
import { fireEvent, waitFor } from '@testing-library/react';
import { getRules } from '@/src/app/[lang]/folders-storage/actions';

jest.mock('@/src/app/[lang]/folders-storage/actions');
const mockedGetRules = getRules as jest.Mock;

describe('Components - BasePublicationPermissions', () => {
  it('Should correctly render BasePublicationPermissions component', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, findByTestId } = renderWithContext(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    const compareChangesButton = await findByTestId('publication-permissions-compare-changes-button');
    expect(compareChangesButton).toBeTruthy();
  });

  it('Should not render compare button inside BasePublicationPermissions component if rules same', async () => {
    mockedGetRules.mockResolvedValue({
      id: [],
    });
    const { getByTestId, queryByTestId } = renderWithContext(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('publication-permissions-compare-changes-button')).toBeNull();
    });
  });

  it('Should not render compare button inside BasePublicationPermissions component if props are invalid', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, queryByTestId } = renderWithContext(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={false} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('publication-permissions-compare-changes-button')).toBeNull();
    });
  });

  it('Should open structure modal', () => {
    const { getByTestId } = renderWithContext(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );

    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    fireEvent.click(reviewStructureButton);

    const structureModal = getByTestId('publication-permissions-structure-modal');
    expect(structureModal).toBeTruthy();
  });

  it('Should open compare modal', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, findByTestId } = renderWithContext(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );

    const compareChangesButton = await findByTestId('publication-permissions-compare-changes-button');
    fireEvent.click(compareChangesButton);

    const compareModal = getByTestId('publication-permissions-compare-modal');
    expect(compareModal).toBeTruthy();
  });
});
