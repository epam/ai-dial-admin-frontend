import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, ToolsetPublication } from '@/src/models/dial/publications';
import { ToolsetAuthType } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';
import PublicationView from '../View';

// Mock all dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => vi.fn((fn, ...args) => fn(...args)),
}));

vi.mock('@/src/components/EntityHeaderControls/PublicationsHeader', () => ({
  default: ({ children }: any) => (
    <div role="region" aria-label="publications-header">
      <div role="region" aria-label="auth-buttons-container">
        {children}
      </div>
    </div>
  ),
}));

vi.mock('@/src/components/Toolsets/Auth/AuthButtons', () => ({
  default: ({ selectedToolset }: any) => (
    <div role="region" aria-label="auth-buttons">
      Auth buttons for {selectedToolset.name}
    </div>
  ),
}));

vi.mock('./TabsContent', () => ({
  default: () => <div role="region" aria-label="tabs-content" />,
}));

vi.mock('@/src/app/[lang]/toolsets/actions', () => ({
  signInToolset: vi.fn(),
  signOutToolset: vi.fn(),
}));

vi.mock('@/src/app/actions/publications', () => ({
  updatePublication: vi.fn(),
}));

vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  getRules: vi.fn(),
}));

const createMockPublication = (authType: ToolsetAuthType | null): ToolsetPublication => ({
  path: 'test/publication/path',
  requestName: 'Test Publication',
  author: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  status: 'pending',
  action: ActionType.ADD,
  folderId: '/test-folder/',
  rules: [],
  toolSetResources: [
    {
      sourceUrl: 'test-source',
      targetUrl: 'test-target',
      reviewUrl: 'test-review',
      action: ActionType.ADD,
      toolSetResource: {
        name: 'test-toolset',
        displayName: 'Test Toolset',
        description: 'Test toolset description',
        authSettings: authType
          ? {
              authenticationType: authType,
            }
          : undefined,
      },
    },
  ],
});

describe('PublicationView - AuthButtons conditional rendering', () => {
  test('should not render AuthButtons when authentication type is NONE', () => {
    const publication = createMockPublication(ToolsetAuthType.NONE);

    render(<PublicationView view={ApplicationRoute.ToolsetPublications} publication={publication} />);

    const authButtons = screen.queryByRole('region', { name: 'auth-buttons' });
    expect(authButtons).not.toBeInTheDocument();
  });

  test('should render AuthButtons when authentication type is API_KEY', () => {
    const publication = createMockPublication(ToolsetAuthType.API_KEY);

    render(<PublicationView view={ApplicationRoute.ToolsetPublications} publication={publication} />);

    const authButtons = screen.getByRole('region', { name: 'auth-buttons' });
    expect(authButtons).toBeInTheDocument();
    expect(authButtons).toHaveTextContent('Auth buttons for test-toolset');
  });

  test('should render AuthButtons when authentication type is OAUTH', () => {
    const publication = createMockPublication(ToolsetAuthType.OAUTH);

    render(<PublicationView view={ApplicationRoute.ToolsetPublications} publication={publication} />);

    const authButtons = screen.getByRole('region', { name: 'auth-buttons' });
    expect(authButtons).toBeInTheDocument();
    expect(authButtons).toHaveTextContent('Auth buttons for test-toolset');
  });

  test('should not render AuthButtons when authSettings is undefined', () => {
    const publication = createMockPublication(null);

    render(<PublicationView view={ApplicationRoute.ToolsetPublications} publication={publication} />);

    const authButtons = screen.queryByRole('region', { name: 'auth-buttons' });
    expect(authButtons).not.toBeInTheDocument();
  });
});
