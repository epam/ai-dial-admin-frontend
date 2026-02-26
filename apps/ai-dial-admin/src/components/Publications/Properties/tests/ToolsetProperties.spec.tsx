import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ActionType, PublicationToolset, ToolsetPublication } from '@/src/models/dial/publications';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import ToolsetProperties from '../ToolsetProperties';

vi.mock('@/src/context/assets/ToolsetsFolderContext', () => ({
  useToolsetsFolder: vi.fn(),
  useToolsetFolder: vi.fn(),
  ToolsetsFolderProvider: ({ children }: any) => <div>{children}</div>,
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

let capturedToolsetDetailsProps: any = {};
vi.mock('@/src/components/Publications/Assets/Toolset/ToolsetDetails', () => ({
  default: (props: any) => {
    capturedToolsetDetailsProps = props;
    return (
      <div role="region" aria-label="toolset-details">
        <span>Resources: {props.publication.toolSetResources?.length || 0}</span>
      </div>
    );
  },
}));

const mockToolsetResources: PublicationToolset[] = [
  {
    sourceUrl: 'source/toolset1',
    targetUrl: 'target/toolset1',
    reviewUrl: 'review/toolset1',
    action: ActionType.ADD,
    toolSetResource: {
      name: 'Test Toolset',
      path: 'toolsets/folder/TestToolset__1.0.0',
      version: '1.0.0',
    } as any,
  },
];

const createMockPublication = (resources?: PublicationToolset[]): ToolsetPublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  toolSetResources: resources ?? mockToolsetResources,
});

describe('Publications :: ToolsetProperties', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedBaseProps = {};
    capturedToolsetDetailsProps = {};

    (useToolsetFolder as Mock).mockReturnValue({
      fetchFiles: vi.fn(),
      files: [{}],
    });
  });

  test('renders BaseProperties and ToolsetDetails components', () => {
    render(<ToolsetProperties publication={createMockPublication()} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'toolset-details' })).toBeInTheDocument();
  });

  test('passes publication to BaseProperties', () => {
    const publication = createMockPublication();
    render(<ToolsetProperties publication={publication} onChange={mockOnChange} />);

    expect(capturedBaseProps.publication).toBe(publication);
  });

  test('passes onChange to BaseProperties', () => {
    render(<ToolsetProperties publication={createMockPublication()} onChange={mockOnChange} />);

    expect(capturedBaseProps.onChange).toBe(mockOnChange);
  });

  test('passes useToolsetFolder as getContext to BaseProperties', () => {
    render(<ToolsetProperties publication={createMockPublication()} onChange={mockOnChange} />);

    expect(capturedBaseProps.getContext).toBe(useToolsetFolder);
  });

  test('passes publication to ToolsetDetails', () => {
    const publication = createMockPublication();
    render(<ToolsetProperties publication={publication} onChange={mockOnChange} />);

    expect(capturedToolsetDetailsProps.publication).toBe(publication);
  });

  test('passes onChange to ToolsetDetails', () => {
    render(<ToolsetProperties publication={createMockPublication()} onChange={mockOnChange} />);

    expect(capturedToolsetDetailsProps.onChange).toBe(mockOnChange);
  });

  test('renders toolset resources count', () => {
    render(<ToolsetProperties publication={createMockPublication()} onChange={mockOnChange} />);

    expect(screen.getByText('Resources: 1')).toBeInTheDocument();
  });

  test('renders with empty toolset resources', () => {
    render(<ToolsetProperties publication={createMockPublication([])} onChange={mockOnChange} />);

    expect(screen.getByText('Resources: 0')).toBeInTheDocument();
  });

  test('renders without onChange prop', () => {
    render(<ToolsetProperties publication={createMockPublication()} />);

    expect(screen.getByRole('region', { name: 'base-properties' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'toolset-details' })).toBeInTheDocument();
    expect(capturedBaseProps.onChange).toBeUndefined();
    expect(capturedToolsetDetailsProps.onChange).toBeUndefined();
  });
});
