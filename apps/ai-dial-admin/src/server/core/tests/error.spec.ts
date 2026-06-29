import { describe, expect, test } from 'vitest';
import { getStatusReason, normalizeCoreError } from '../error';

describe('Server :: Core :: normalizeCoreError', () => {
  test('plain-text body becomes the message with a status-reason header', () => {
    expect(normalizeCoreError('Target file already exists', 400)).toEqual({
      error: 'Bad Request',
      message: 'Target file already exists',
      status: 400,
    });
  });

  test('flat JSON body keeps message and error', () => {
    expect(normalizeCoreError(JSON.stringify({ message: 'bad input', error: 'ValidationError' }), 400)).toEqual({
      error: 'ValidationError',
      message: 'bad input',
      status: 400,
    });
  });

  test('nested { error: { message, code } } body is flattened', () => {
    expect(normalizeCoreError(JSON.stringify({ error: { message: 'no access', code: 'forbidden' } }), 403)).toEqual({
      error: 'forbidden',
      message: 'no access',
      status: 403,
    });
  });

  test('empty body falls back to status reason and generic message', () => {
    expect(normalizeCoreError('', 404)).toEqual({
      error: 'Not Found',
      message: 'Error status: 404',
      status: 404,
    });
  });

  test('non-object JSON is treated as plain text', () => {
    expect(normalizeCoreError('null', 500)).toEqual({
      error: 'Internal Server Error',
      message: 'null',
      status: 500,
    });
  });

  test('unknown status uses the generic reason', () => {
    expect(getStatusReason(418)).toBe('Request error');
    expect(normalizeCoreError('teapot', 418)).toEqual({
      error: 'Request error',
      message: 'teapot',
      status: 418,
    });
  });
});
