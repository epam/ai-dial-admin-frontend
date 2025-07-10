import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ActionType, Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import BasePublicationsList from './PublicationsList';

const mockData: Publication[] = [
  {
    path: 'path1',
    requestName: 'Publication 1',
    author: 'author1',
    createdAt: 1000,
    status: 'path1',
    action: ActionType.ADD,
    folderId: 'Publication 1',
  },
  {
    path: 'path2',
    requestName: 'Publication 2',
    author: 'author2',
    createdAt: 1000,
    status: 'path2',
    action: ActionType.ADD,
    folderId: 'Publication 2',
  },
];

describe('Components - BasePublicationsList', () => {
  test('Should render list view with data and titles', () => {
    render(<BasePublicationsList data={mockData} route={ApplicationRoute.PromptPublications} />);
    expect(screen.getByText(MenuI18nKey.PromptPublications)).toBeInTheDocument();
    expect(screen.getAllByRole('presentation').length).not.toBe(0); // grid container
  });

  test('Should render empty list view', () => {
    render(<BasePublicationsList data={[]} route={ApplicationRoute.PromptPublications} />);
    expect(screen.getByText(EntitiesI18nKey.NoPublications)).toBeInTheDocument();
  });
});
