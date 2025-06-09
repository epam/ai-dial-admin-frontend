import { getError, getErrorMessage, getParsedError } from '../error';

describe('Utils :: getParsedError', () => {
  it('Should return error object', () => {
    const error = { message: 'message' };
    const result = getParsedError(JSON.stringify(error));
    expect(result).toEqual(error);
  });

  it('Should return empty object', () => {
    const result = getParsedError('');
    expect(result).toEqual({});
  });
});

describe('Utils :: getError', () => {
  it('Should return Request error text', () => {
    const result = getError({ error: new Response() as any });
    expect(result).toEqual('Request error');
  });

  it('Should return Request error text', () => {
    const result = getError({ message: 'message' });
    expect(result).toEqual('Request error');
  });

  it('Should return error text', () => {
    const result = getError({ error: 'Error header' });
    expect(result).toEqual('Error header');
  });
});

describe('Utils :: getErrorMessage', () => {
  it('Should return Error status: 400 text', () => {
    const result = getErrorMessage({ message: new Response() as any }, 400);
    expect(result).toEqual('Error status: 400');
  });

  it('Should return Error status: 403 text', () => {
    const result = getErrorMessage({ error: 'message' }, 403);
    expect(result).toEqual('Error status: 403');
  });

  it('Should return error text', () => {
    const result = getErrorMessage({ message: 'Error message' }, 500);
    expect(result).toEqual('Error message');
  });
});
