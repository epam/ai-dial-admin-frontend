import { describe, expect, it, vi } from 'vitest';

import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { ActionType, Publication } from '@/src/models/dial/publications';

import { getFormDataForPublication } from '../utils';

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
    const result = getFormDataForPublication(createPublication());

    expect(result).toBeInstanceOf(FormData);
  });

  it('should append a "publication" entry to the FormData', () => {
    const result = getFormDataForPublication(createPublication());

    expect(result.has('publication')).toBe(true);
  });

  it('should append a Blob with the correct content type', () => {
    const result = getFormDataForPublication(createPublication());
    const blob = result.get('publication') as Blob;

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(APPLICATION_JSON_TYPE);
  });

  it('should serialize the publication as JSON in the Blob', () => {
    const publication = createPublication({ requestName: 'my-pub' });

    const appendSpy = vi.spyOn(FormData.prototype, 'append');
    getFormDataForPublication(publication);

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
    getFormDataForPublication(publication);

    const appendedBlob = appendSpy.mock.calls[0][1] as Blob;
    const expectedJson = JSON.stringify(publication);
    const expectedBlob = new Blob([expectedJson], {
      type: APPLICATION_JSON_TYPE,
    });

    expect(appendedBlob.size).toBe(expectedBlob.size);
    expect(appendedBlob.type).toBe(APPLICATION_JSON_TYPE);

    appendSpy.mockRestore();
  });

  it('should only contain one entry in the FormData', () => {
    const result = getFormDataForPublication(createPublication());
    const entries = Array.from(result.entries());

    expect(entries).toHaveLength(1);
    expect(entries[0][0]).toBe('publication');
  });
});
