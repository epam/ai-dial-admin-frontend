import fetch from 'jest-fetch-mock';
import { importConfig, importZipConfig } from './actions';

describe('App :: server actions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('Should call import Config', async () => {
    fetch.mockResponse('');
    const formData = new FormData();
    formData.append('file', new Blob());
    importConfig(formData).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
      expect(call?.body).toEqual(formData);
    });
  });

  it('Should call import Zip Config', async () => {
    fetch.mockResponse('');
    const formData = new FormData();
    formData.append('file', new Blob());
    importZipConfig(formData).then(() => {
      expect(fetch.mock.calls.length).toEqual(1);

      const call = fetch.mock.calls[0][1];
      expect(call?.method).toBe('POST');
      expect(call?.body).toEqual(formData);
    });
  });
});
