import { describe, expect, it, vi } from 'vitest';

import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { ActionType, ApplicationPublication, Publication } from '@/src/models/dial/publications';

import { getCorrectPublication, getFormDataForPublication } from '../utils';

const createPublication = (overrides?: Partial<Publication>): Publication => ({
  path: '/test/path',
  requestName: 'test-request',
  author: 'test-author',
  createdAt: '2026-01-01T00:00:00Z',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder-1',
  ...overrides,
});

describe('getFormDataForPublication', () => {
  it('should return a FormData instance', () => {
    const result = getFormDataForPublication(createPublication(), []);

    expect(result).toBeInstanceOf(FormData);
  });

  it('should append a "publication" entry to the FormData', () => {
    const result = getFormDataForPublication(createPublication(), []);

    expect(result.has('publication')).toBe(true);
  });

  it('should append a Blob with the correct content type', () => {
    const result = getFormDataForPublication(createPublication(), []);
    const blob = result.get('publication') as Blob;

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(APPLICATION_JSON_TYPE);
  });

  it('should serialize the publication as JSON in the Blob', () => {
    const publication = createPublication({ requestName: 'my-pub' });

    const appendSpy = vi.spyOn(FormData.prototype, 'append');
    getFormDataForPublication(publication, []);

    const appendedBlob = appendSpy.mock.calls[0][1] as Blob;
    expect(appendSpy).toHaveBeenCalledWith('publication', appendedBlob);

    const expectedJson = JSON.stringify(publication);
    const blobContent = new Blob([expectedJson], {
      type: APPLICATION_JSON_TYPE,
    });
    expect(appendedBlob.size).toBe(blobContent.size);
    expect(appendedBlob.type).toBe(APPLICATION_JSON_TYPE);

    appendSpy.mockRestore();
  });

  it('should include optional fields in the serialized Blob', () => {
    const publication = createPublication({
      displayAuthor: 'Display Author',
      rules: [{ source: '*', function: 'true' } as any],
    });

    const appendSpy = vi.spyOn(FormData.prototype, 'append');
    getFormDataForPublication(publication, []);

    const appendedBlob = appendSpy.mock.calls[0][1] as Blob;
    const expectedJson = JSON.stringify(publication);
    const expectedBlob = new Blob([expectedJson], {
      type: APPLICATION_JSON_TYPE,
    });

    expect(appendedBlob.size).toBe(expectedBlob.size);
    expect(appendedBlob.type).toBe(APPLICATION_JSON_TYPE);

    appendSpy.mockRestore();
  });

  it('should only contain one entry when no files are provided', () => {
    const result = getFormDataForPublication(createPublication(), []);
    const entries = Array.from(result.entries());

    expect(entries).toHaveLength(1);
    expect(entries[0][0]).toBe('publication');
  });

  it('should append files to the FormData when provided', () => {
    const files = [
      new File(['content-a'], 'file-a.txt', { type: 'text/plain' }),
      new File(['content-b'], 'file-b.txt', { type: 'text/plain' }),
    ];
    const result = getFormDataForPublication(createPublication(), files);
    const allFiles = result.getAll('files');

    expect(allFiles).toHaveLength(2);
    expect((allFiles[0] as File).name).toBe('file-a.txt');
    expect((allFiles[1] as File).name).toBe('file-b.txt');
  });

  it('should not append files entry when files array is empty', () => {
    const result = getFormDataForPublication(createPublication(), []);

    expect(result.has('files')).toBe(false);
  });

  it('should contain publication and files entries when files are provided', () => {
    const files = [new File(['data'], 'doc.pdf', { type: 'application/pdf' })];
    const result = getFormDataForPublication(createPublication(), files);
    const entries = Array.from(result.entries());

    expect(entries).toHaveLength(2);
    expect(entries[0][0]).toBe('publication');
    expect(entries[1][0]).toBe('files');
  });
});

describe('getCorrectPublication', () => {
  const basePublication = (): ApplicationPublication => ({
    path: '/test/path',
    requestName: 'test-request',
    author: 'test-author',
    createdAt: '2026-01-01T00:00:00Z',
    status: 'pending',
    action: ActionType.ADD,
    folderId: 'folder-1',
    applicationResources: [
      {
        sourceUrl: '',
        targetUrl: '',
        reviewUrl: '',
        action: ActionType.ADD,
        applicationResource: {
          name: 'app-resource',
          path: '/app',
          folderId: 'f1',
          version: '1.0',
          author: 'author',
          endpoint: 'https://example.com',
          icon_url: '',
          reference: '',
          max_retry_attempts: 0,
          forward_auth_token: false,
          editor_url: '',
          viewer_url: '',
          application_type_schema_id: 'schema-1',
          description_keywords: [],
          input_attachment_types: [],
          dependencies: [],
          interceptors: [],
        },
      },
    ],
  });

  it('should return publication with defaults and applicationProperties from record when no temp fields', () => {
    const publication = basePublication();
    publication.applicationResources![0].applicationResource.defaults = { foo: 'bar' };
    publication.applicationResources![0].applicationResource.application_properties = { baz: 42 };

    const result = getCorrectPublication(publication) as ApplicationPublication;

    expect(result.applicationResources).toHaveLength(1);
    expect(result.applicationResources![0].applicationResource.defaults).toEqual({ foo: 'bar' });
    expect(result.applicationResources![0].applicationResource.application_properties).toEqual({ baz: 42 });
    expect(result.applicationResources![0].applicationResource).not.toHaveProperty('defaultsTemp');
  });

  it('should preserve top-level publication fields', () => {
    const publication = basePublication();
    publication.path = '/custom/path';
    publication.requestName = 'my-request';
    publication.applicationResources![0].applicationResource.defaults = {};

    const result = getCorrectPublication(publication) as ApplicationPublication;

    expect(result.path).toBe('/custom/path');
    expect(result.requestName).toBe('my-request');
    expect(result.applicationResources).toHaveLength(1);
  });

  it('should handle publication with empty applicationResources', () => {
    const publication = basePublication();
    publication.applicationResources = [];

    const result = getCorrectPublication(publication) as ApplicationPublication;

    expect(result.applicationResources).toHaveLength(1);
    expect(result.applicationResources![0].applicationResource.defaults).toEqual({});
    expect(result.applicationResources![0].applicationResource.applicationProperties).toEqual({});
  });

  it('should handle publication with undefined applicationResources', () => {
    const publication = { ...basePublication(), applicationResources: undefined };

    const result = getCorrectPublication(publication) as ApplicationPublication;

    expect(result.applicationResources).toHaveLength(1);
    expect(result.applicationResources![0].applicationResource.defaults).toEqual({});
    expect(result.applicationResources![0].applicationResource.applicationProperties).toEqual({});
  });
});
