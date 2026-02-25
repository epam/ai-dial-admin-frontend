import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import ApplicationProperties from '../ApplicationProperties';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { ActionType, ApplicationPublication, PublicationApplication } from '@/src/models/dial/publications';
import { DialApplicationScheme } from '@/src/models/dial/application';

vi.mock('@/src/context/assets/AppsFolderContext', () => ({
  useAppsFolder: vi.fn(),
  AppsFolderProvider: ({ children }: any) => <div>{children}</div>,
}));

let capturedBaseProps: any = {};
vi.mock('../BaseProperties', () => ({
  default: (props: any) => {
    capturedBaseProps = props;
    return (
      <div role="region" aria-label="base-properties">
        Base Properties
      </div>
    );
  },
}));

let capturedAppDetailsProps: any = {};
vi.mock('@/src/components/Publications/Assets/Application/ApplicationDetails', () => ({
  default: (props: any) => {
    capturedAppDetailsProps = props;
    return (
      <div role="region" aria-label="application-details">
        <span>Resources: {props.publication.applicationResources?.length || 0}</span>
      </div>
    );
  },
}));

const mockApplicationResources: PublicationApplication[] = [
  {
    sourceUrl: 'source/app1',
    targetUrl: 'target/app1',
    reviewUrl: 'review/app1',
    action: ActionType.ADD,
    applicationResource: {
      name: 'Test App',
      path: 'apps/folder/TestApp__1.0.0',
      version: '1.0.0',
    } as any,
  },
];

const mockSchemes: DialApplicationScheme[] = [
  { $id: 'schema-1', title: 'Schema 1' } as DialApplicationScheme,
];

const createMockPublication = (
  resources?: PublicationApplication[],
): ApplicationPublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  applicationResources: resources ?? mockApplicationResources,
});

describe('Publications :: ApplicationProperties', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedBaseProps = {};
    capturedAppDetailsProps = {};

    (useAppsFolder as Mock).mockReturnValue({
      fetchFiles: vi.fn(),
      files: [{}],
    });
  });

  test('renders BaseProperties and ApplicationDetails components', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'application-details' })).toBeInTheDocument();
  });

  test('passes publication to BaseProperties', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedBaseProps.publication).toBe(publication);
  });

  test('passes onChange to BaseProperties', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedBaseProps.onChange).toBe(mockOnChange);
  });

  test('passes useAppsFolder as getContext to BaseProperties', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedBaseProps.getContext).toBe(useAppsFolder);
  });

  test('passes publication to ApplicationDetails', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedAppDetailsProps.publication).toBe(publication);
  });

  test('passes onChange to ApplicationDetails', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedAppDetailsProps.onChange).toBe(mockOnChange);
  });

  test('passes applicationSchemes to ApplicationDetails', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(capturedAppDetailsProps.applicationSchemes).toBe(mockSchemes);
  });

  test('renders application resources count', () => {
    const publication = createMockPublication();

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(screen.getByText('Resources: 1')).toBeInTheDocument();
  });

  test('renders with empty application resources', () => {
    const publication = createMockPublication([]);

    render(
      <ApplicationProperties
        publication={publication}
        onChange={mockOnChange}
        applicationSchemes={mockSchemes}
      />,
    );

    expect(screen.getByText('Resources: 0')).toBeInTheDocument();
  });

  test('renders without onChange prop', () => {
    const publication = createMockPublication();

    render(<ApplicationProperties publication={publication} applicationSchemes={mockSchemes} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'application-details' })).toBeInTheDocument();
    expect(capturedBaseProps.onChange).toBeUndefined();
    expect(capturedAppDetailsProps.onChange).toBeUndefined();
  });

  test('renders without applicationSchemes prop', () => {
    const publication = createMockPublication();

    render(<ApplicationProperties publication={publication} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'application-details' })).toBeInTheDocument();
    expect(capturedAppDetailsProps.applicationSchemes).toBeUndefined();
  });
});
