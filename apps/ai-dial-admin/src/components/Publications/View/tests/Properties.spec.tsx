import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PublicationProperties from '../Properties';

const fakePublication = { id: '1', name: 'Test Publication', createdAt: '2020-12-12T22:22' } as any;
const fakeSchemes = [{ id: 'scheme1' }] as any;

describe('PublicationProperties', () => {
  test('renders application publication properties', () => {
    render(
      <PublicationProperties
        view={ApplicationRoute.ApplicationPublications}
        publication={fakePublication}
        applicationSchemes={fakeSchemes}
      />,
    );
    expect(screen.getByText(EntitiesI18nKey.FolderStorage)).toBeInTheDocument();
  });

  test('renders nothing for unknown view', () => {
    const { container } = render(<PublicationProperties view={ApplicationRoute.Home} publication={fakePublication} />);
    expect(container.innerHTML).toBe('');
  });
});
