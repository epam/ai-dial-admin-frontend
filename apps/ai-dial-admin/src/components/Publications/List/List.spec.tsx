import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ActionType, Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import PublicationsList from './List';

const mockData: Publication[] = [
  {
    path: 'path1',
    requestName: 'Publication 1',
    author: 'author1',
    createdAt: '1000',
    status: 'status1',
    action: ActionType.ADD,
    folderId: 'folderId 1',
  },
  {
    path: 'path2',
    requestName: 'Publication 2',
    author: 'author2',
    createdAt: '1000',
    status: 'status2',
    action: ActionType.ADD,
    folderId: 'folderId 2',
  },
];

describe('Components - BasePublicationsList', () => {
  test('Should render list view with data and titles', () => {
    render(<PublicationsList data={mockData} route={ApplicationRoute.PromptPublications} />);
    expect(screen.getByText(MenuI18nKey.PromptPublications)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('Should render empty list view', () => {
    render(<PublicationsList data={[]} route={ApplicationRoute.PromptPublications} />);
    expect(screen.getByText(EntitiesI18nKey.NoPublications)).toBeInTheDocument();
  });
});
