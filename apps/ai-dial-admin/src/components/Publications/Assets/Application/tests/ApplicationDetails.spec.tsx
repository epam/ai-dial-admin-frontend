import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DeploymentAsset } from '@/src/models/dial/deployment-asset';
import {
  ActionType,
  ApplicationPublication,
  PublicationApplication,
} from '@/src/models/dial/publications';
import { DialApplicationScheme } from '@/src/models/dial/application';
import ApplicationDetails from '../ApplicationDetails';

let capturedAssetProps: any = {};

vi.mock('@/src/components/Assets/Apps/Properties', () => ({
  default: (props: any) => {
    capturedAssetProps = props;
    return <section aria-label="application-properties" />;
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

const mockApplicationResource = {
  name: 'Test App',
  description: 'A test application',
  path: 'apps/folder/TestApp__1.0.0',
  version: '1.0.0',
  folderId: 'apps/folder',
  author: 'author@test.com',
  applicationTypeSchemaId: 'schema-1',
  descriptionKeywords: [],
  inputAttachmentTypes: [],
  dependencies: [],
  interceptors: [],
  endpoint: 'http://localhost:3000',
  iconUrl: '',
  reference: '',
  maxRetryAttempts: 3,
  forwardAuthToken: false,
  editorUrl: '',
  viewerUrl: '',
};

const mockApplicationResources: PublicationApplication[] = [
  {
    sourceUrl: 'source/app1',
    targetUrl: 'target/app1',
    reviewUrl: 'review/app1',
    action: ActionType.ADD,
    applicationResource: mockApplicationResource as any,
  },
];

const createMockPublication = (
  applicationResources?: PublicationApplication[],
): ApplicationPublication => ({
  path: 'publications/test-publication',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  applicationResources: applicationResources ?? mockApplicationResources,
});

const mockSchemes: DialApplicationScheme[] = [
  {
    $id: 'schema-1',
    title: 'Custom App Schema',
    description: 'A test schema',
  } as DialApplicationScheme,
];

const setup = (
  props: Partial<{
    publication: ApplicationPublication;
    applicationSchemes: DialApplicationScheme[];
    onChange: any;
  }> = {},
) => {
  const onChange = props.onChange ?? vi.fn();
  const publication = props.publication ?? createMockPublication();
  const applicationSchemes = props.applicationSchemes ?? mockSchemes;

  const utils = render(
    <ApplicationDetails
      publication={publication}
      applicationSchemes={applicationSchemes}
      onChange={onChange}
    />,
  );

  return { onChange, publication, ...utils };
};

describe('Publications :: ApplicationDetails', () => {
  test('renders ApplicationAssetProperties component', () => {
    setup();

    expect(screen.getByRole('region', { name: 'application-properties' })).toBeInTheDocument();
  });

  test('passes applicationResource as asset prop', () => {
    setup();

    expect(capturedAssetProps.asset).toBe(mockApplicationResource);
  });

  test('passes runners prop from applicationSchemes', () => {
    setup();

    expect(capturedAssetProps.runners).toEqual(mockSchemes);
  });

  test('passes isPublication as true', () => {
    setup();

    expect(capturedAssetProps.isPublication).toBe(true);
  });

  test('passes onChange handler to ApplicationAssetProperties', () => {
    setup();

    expect(capturedAssetProps.onChange).toBeDefined();
    expect(typeof capturedAssetProps.onChange).toBe('function');
  });

  test('onChangeApplication calls onChange with updated publication', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const updatedAsset: Partial<DeploymentAsset> = {
      ...mockApplicationResource,
      name: 'Updated App',
      version: '2.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any;

    capturedAssetProps.onChange(updatedAsset);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.applicationResources).toHaveLength(1);
    expect(updatedPublication.applicationResources[0].applicationResource.name).toBe('Updated App');
    expect(updatedPublication.applicationResources[0].applicationResource.version).toBe('2.0.0');
  });

  test('onChangeApplication updates path with name and version', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const updatedAsset = {
      ...mockApplicationResource,
      name: 'NewApp',
      version: '3.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any;

    capturedAssetProps.onChange(updatedAsset);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.applicationResources[0].applicationResource.path).toBe(
      'apps/folder/NewApp__3.0.0',
    );
  });

  test('onChangeApplication preserves other publication properties', () => {
    const onChange = vi.fn();
    const publication = createMockPublication();
    setup({ onChange, publication });

    capturedAssetProps.onChange({
      ...mockApplicationResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.path).toBe(publication.path);
    expect(updatedPublication.requestName).toBe(publication.requestName);
    expect(updatedPublication.author).toBe(publication.author);
    expect(updatedPublication.displayAuthor).toBe(publication.displayAuthor);
    expect(updatedPublication.createdAt).toBe(publication.createdAt);
    expect(updatedPublication.status).toBe(publication.status);
    expect(updatedPublication.action).toBe(publication.action);
    expect(updatedPublication.folderId).toBe(publication.folderId);
  });

  test('onChangeApplication preserves PublicationEntity properties on the resource', () => {
    const onChange = vi.fn();
    setup({ onChange });

    capturedAssetProps.onChange({
      ...mockApplicationResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any);

    const updatedResource = onChange.mock.calls[0][0].applicationResources[0];
    expect(updatedResource.sourceUrl).toBe('source/app1');
    expect(updatedResource.targetUrl).toBe('target/app1');
    expect(updatedResource.reviewUrl).toBe('review/app1');
    expect(updatedResource.action).toBe(ActionType.ADD);
  });

  test('does not call onChange when onChange is not provided', () => {
    render(
      <ApplicationDetails
        publication={createMockPublication()}
        applicationSchemes={mockSchemes}
      />,
    );

    // Should not throw
    capturedAssetProps.onChange?.({
      ...mockApplicationResource,
      name: 'Changed',
      version: '1.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any);
  });

  test('passes undefined asset when applicationResources is undefined', () => {
    const publication = createMockPublication();
    delete publication.applicationResources;
    setup({ publication });

    expect(capturedAssetProps.asset).toBeUndefined();
  });

  test('passes undefined runners when applicationSchemes is not provided', () => {
    render(
      <ApplicationDetails
        publication={createMockPublication()}
      />,
    );

    expect(capturedAssetProps.runners).toBeUndefined();
  });

  test('onChangeApplication handles empty name gracefully', () => {
    const onChange = vi.fn();
    setup({ onChange });

    capturedAssetProps.onChange({
      ...mockApplicationResource,
      name: '',
      version: '1.0.0',
      path: 'apps/folder/TestApp__1.0.0',
    } as any);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedResource = onChange.mock.calls[0][0].applicationResources[0].applicationResource;
    expect(updatedResource.path).toBe('apps/folder/__1.0.0');
  });

  test('onChangeApplication only updates first application resource', () => {
    const multipleResources: PublicationApplication[] = [
      {
        sourceUrl: 'source/app1',
        targetUrl: 'target/app1',
        reviewUrl: 'review/app1',
        action: ActionType.ADD,
        applicationResource: { ...mockApplicationResource, name: 'App1' } as any,
      },
      {
        sourceUrl: 'source/app2',
        targetUrl: 'target/app2',
        reviewUrl: 'review/app2',
        action: ActionType.ADD,
        applicationResource: { ...mockApplicationResource, name: 'App2' } as any,
      },
    ];

    const publication = createMockPublication(multipleResources);
    const onChange = vi.fn();
    setup({ publication, onChange });

    capturedAssetProps.onChange({
      ...mockApplicationResource,
      name: 'UpdatedApp1',
      version: '2.0.0',
      path: 'apps/folder/App1__1.0.0',
    } as any);

    const updatedResources = onChange.mock.calls[0][0].applicationResources;
    expect(updatedResources).toHaveLength(2);
    expect(updatedResources[0].applicationResource.name).toBe('UpdatedApp1');
    expect(updatedResources[1].applicationResource.name).toBe('App2');
  });

  test('renders with delete action publication', () => {
    const publication = createMockPublication();
    publication.action = ActionType.DELETE;
    setup({ publication });

    expect(screen.getByRole('region', { name: 'application-properties' })).toBeInTheDocument();
  });
});
