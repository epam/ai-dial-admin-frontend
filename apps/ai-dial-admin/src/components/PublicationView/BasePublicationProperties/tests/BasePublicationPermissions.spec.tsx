import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import BasePublicationPermissions from '@/src/components/PublicationView/BasePublicationProperties/BasePublicationPermissions';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/app/[lang]/folders-storage/actions');
const mockedGetRules = getRules;

describe('Components - BasePublicationPermissions', () => {
  test('Should correctly render BasePublicationPermissions component', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, findByTestId } = render(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    const compareChangesButton = await findByTestId('publication-permissions-compare-changes-button');
    expect(compareChangesButton).toBeTruthy();
  });

  test('Should not render compare button inside BasePublicationPermissions component if rules same', async () => {
    mockedGetRules.mockResolvedValue({
      id: [],
    });
    const { getByTestId, queryByTestId } = render(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('publication-permissions-compare-changes-button')).toBeNull();
    });
  });

  test('Should not render compare button inside BasePublicationPermissions component if props are invalid', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, queryByTestId } = render(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={false} />,
    );
    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    expect(reviewStructureButton).toBeTruthy();

    await waitFor(() => {
      expect(queryByTestId('publication-permissions-compare-changes-button')).toBeNull();
    });
  });

  test('Should open structure modal', () => {
    const { getByTestId } = render(<BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />);

    const reviewStructureButton = getByTestId('publication-permissions-review-structure-button');
    fireEvent.click(reviewStructureButton);

    const structureModal = getByTestId('publication-permissions-structure-modal');
    expect(structureModal).toBeTruthy();
  });

  test('Should open compare modal', async () => {
    mockedGetRules.mockResolvedValue({
      id: [{ id: 'rule-1' }],
    });
    const { getByTestId, findByTestId } = render(
      <BasePublicationPermissions rules={[]} folderId={'id'} showCompare={true} />,
    );

    const compareChangesButton = await findByTestId('publication-permissions-compare-changes-button');
    fireEvent.click(compareChangesButton);

    const compareModal = getByTestId('publication-permissions-compare-modal');
    expect(compareModal).toBeTruthy();
  });
});
