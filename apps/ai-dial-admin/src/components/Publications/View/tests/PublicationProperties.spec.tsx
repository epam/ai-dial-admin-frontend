import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PublicationProperties from '../Properties';

const fakePublication = { id: '1', name: 'Test Publication' } as any;
const fakeSchemes = [{ id: 'scheme1' }] as any;

describe('PublicationProperties', () => {
  test('renders prompt publication properties', () => {
    render(<PublicationProperties view={ApplicationRoute.PromptPublications} publication={fakePublication} />);
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
  });

  test('renders file publication properties', () => {
    render(<PublicationProperties view={ApplicationRoute.FilePublications} publication={fakePublication} />);
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
  });

  test('renders application publication properties', () => {
    render(
      <PublicationProperties
        view={ApplicationRoute.ApplicationPublications}
        publication={fakePublication}
        applicationSchemes={fakeSchemes}
      />,
    );
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
  });

  test('renders nothing for unknown view', () => {
    const { container } = render(<PublicationProperties view={ApplicationRoute.Home} publication={fakePublication} />);
    expect(container.innerHTML).toBe('');
  });
});
