import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PublicationProperties from '../PublicationProperties';
import { ApplicationRoute } from '@/src/types/routes';

const fakePublication = { id: '1', name: 'Test Publication' } as any;
const fakeSchemes = [{ id: 'scheme1' }] as any;

describe('PublicationProperties', () => {
  it('renders prompt publication properties', () => {
    render(<PublicationProperties view={ApplicationRoute.PromptPublications} publication={fakePublication} />);
    expect(screen.getByText(/test publication/i)).toBeInTheDocument();
  });

  it('renders file publication properties', () => {
    render(<PublicationProperties view={ApplicationRoute.FilePublications} publication={fakePublication} />);
    expect(screen.getByText(/test publication/i)).toBeInTheDocument();
  });

  it('renders application publication properties', () => {
    render(
      <PublicationProperties
        view={ApplicationRoute.ApplicationPublications}
        publication={fakePublication}
        applicationSchemes={fakeSchemes}
      />,
    );
    expect(screen.getByText(/test publication/i)).toBeInTheDocument();
  });

  it('renders nothing for unknown view', () => {
    const { container } = render(<PublicationProperties view={ApplicationRoute.Home} publication={fakePublication} />);
    expect(container.innerHTML).toBe('');
  });
});
