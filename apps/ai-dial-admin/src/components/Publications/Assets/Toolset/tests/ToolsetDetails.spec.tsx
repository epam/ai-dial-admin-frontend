import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import {
  ActionType,
  PublicationToolset,
  ToolsetPublication,
} from '@/src/models/dial/publications';
import ToolsetDetails from '../ToolsetDetails';

let capturedPropertiesProps: any = {};

vi.mock('@/src/components/Assets/Toolsets/View/Properties/Properties', () => ({
  default: (props: any) => {
    capturedPropertiesProps = props;
    return <section aria-label="toolset-properties" />;
  },
}));

vi.mock('@/src/utils/files/path', () => ({
  updatePathWithNameAndVersion: (oldPath: string, newName: string, newVersion: string) => {
    const parts = oldPath.split('/').filter(Boolean);
    parts.pop();
    parts.push(`${newName}__${newVersion}`);
    return parts.join('/');
  },
}));

const mockToolsetResource = {
  name: 'Test Toolset',
  description: 'A test toolset',
  path: 'toolsets/folder/TestToolset__1.0.0',
  version: '1.0.0',
  folderId: 'toolsets/folder',
  author: 'author@test.com',
  descriptionKeywords: [],
  endpoint: 'http://localhost:3000',
  iconUrl: '',
  maxRetryAttempts: 3,
};

const mockToolsetResources: PublicationToolset[] = [
  {
    sourceUrl: 'source/toolset1',
    targetUrl: 'target/toolset1',
    reviewUrl: 'review/toolset1',
    action: ActionType.ADD,
    toolSetResource: mockToolsetResource as any,
  },
];

const createMockPublication = (
  toolSetResources?: PublicationToolset[],
): ToolsetPublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  toolSetResources: toolSetResources ?? mockToolsetResources,
});

const setup = (
  props: Partial<{
    publication: ToolsetPublication;
    onChange: any;
  }> = {},
) => {
  const onChange = props.onChange ?? vi.fn();
  const publication = props.publication ?? createMockPublication();

  const utils = render(
    <ToolsetDetails publication={publication} onChange={onChange} />,
  );

  return { onChange, publication, ...utils };
};

describe('Publications :: ToolsetDetails', () => {
  test('renders Properties component', () => {
    setup();

    expect(screen.getByRole('region', { name: 'toolset-properties' })).toBeInTheDocument();
  });

  test('passes toolSetResource as selectedToolset prop', () => {
    setup();

    expect(capturedPropertiesProps.selectedToolset).toBe(mockToolsetResource);
  });

  test('passes isPublication as true', () => {
    setup();

    expect(capturedPropertiesProps.isPublication).toBe(true);
  });

  test('passes onChange handler to Properties', () => {
    setup();

    expect(capturedPropertiesProps.onChange).toBeDefined();
    expect(typeof capturedPropertiesProps.onChange).toBe('function');
  });

  test('onChangeToolset calls onChange with updated publication', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const updatedToolset: Partial<DeploymentAsset> = {
      ...mockToolsetResource,
      name: 'Updated Toolset',
      version: '2.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any;

    capturedPropertiesProps.onChange(updatedToolset);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.toolSetResources).toHaveLength(1);
    expect(updatedPublication.toolSetResources[0].toolSetResource.name).toBe('Updated Toolset');
    expect(updatedPublication.toolSetResources[0].toolSetResource.version).toBe('2.0.0');
  });

  test('onChangeToolset updates path with name and version', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const updatedToolset = {
      ...mockToolsetResource,
      name: 'NewToolset',
      version: '3.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any;

    capturedPropertiesProps.onChange(updatedToolset);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.toolSetResources[0].toolSetResource.path).toBe(
      'toolsets/folder/NewToolset__3.0.0',
    );
  });

  test('onChangeToolset preserves all publication properties', () => {
    const onChange = vi.fn();
    const publication = createMockPublication();
    setup({ onChange, publication });

    capturedPropertiesProps.onChange({
      ...mockToolsetResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any);

    const updated = onChange.mock.calls[0][0];
    expect(updated.path).toBe(publication.path);
    expect(updated.requestName).toBe(publication.requestName);
    expect(updated.author).toBe(publication.author);
    expect(updated.displayAuthor).toBe(publication.displayAuthor);
    expect(updated.createdAt).toBe(publication.createdAt);
    expect(updated.status).toBe(publication.status);
    expect(updated.action).toBe(publication.action);
    expect(updated.folderId).toBe(publication.folderId);
  });

  test('onChangeToolset preserves PublicationEntity properties on the resource', () => {
    const onChange = vi.fn();
    setup({ onChange });

    capturedPropertiesProps.onChange({
      ...mockToolsetResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any);

    const updatedResource = onChange.mock.calls[0][0].toolSetResources[0];
    expect(updatedResource.sourceUrl).toBe('source/toolset1');
    expect(updatedResource.targetUrl).toBe('target/toolset1');
    expect(updatedResource.reviewUrl).toBe('review/toolset1');
    expect(updatedResource.action).toBe(ActionType.ADD);
  });

  test('does not call onChange when onChange is not provided', () => {
    render(<ToolsetDetails publication={createMockPublication()} />);

    // Should not throw
    capturedPropertiesProps.onChange?.({
      ...mockToolsetResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any);
  });

  test('passes undefined selectedToolset when toolSetResources is undefined', () => {
    const publication = createMockPublication();
    delete publication.toolSetResources;
    setup({ publication });

    expect(capturedPropertiesProps.selectedToolset).toBeUndefined();
  });

  test('onChangeToolset handles empty name gracefully', () => {
    const onChange = vi.fn();
    setup({ onChange });

    capturedPropertiesProps.onChange({
      ...mockToolsetResource,
      name: '',
      version: '1.0.0',
      path: 'toolsets/folder/TestToolset__1.0.0',
    } as any);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedResource = onChange.mock.calls[0][0].toolSetResources[0].toolSetResource;
    expect(updatedResource.path).toBe('toolsets/folder/__1.0.0');
  });

  test('onChangeToolset only updates first toolset resource', () => {
    const multipleResources: PublicationToolset[] = [
      {
        sourceUrl: 'source/toolset1',
        targetUrl: 'target/toolset1',
        reviewUrl: 'review/toolset1',
        action: ActionType.ADD,
        toolSetResource: { ...mockToolsetResource, name: 'Toolset1' } as any,
      },
      {
        sourceUrl: 'source/toolset2',
        targetUrl: 'target/toolset2',
        reviewUrl: 'review/toolset2',
        action: ActionType.ADD,
        toolSetResource: { ...mockToolsetResource, name: 'Toolset2' } as any,
      },
    ];

    const publication = createMockPublication(multipleResources);
    const onChange = vi.fn();
    setup({ publication, onChange });

    capturedPropertiesProps.onChange({
      ...mockToolsetResource,
      name: 'UpdatedToolset1',
      version: '2.0.0',
      path: 'toolsets/folder/Toolset1__1.0.0',
    } as any);

    const updatedResources = onChange.mock.calls[0][0].toolSetResources;
    expect(updatedResources).toHaveLength(2);
    expect(updatedResources[0].toolSetResource.name).toBe('UpdatedToolset1');
    expect(updatedResources[1].toolSetResource.name).toBe('Toolset2');
  });
});
