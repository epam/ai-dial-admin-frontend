import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { describe, expect, test } from 'vitest';
import ExportConfig from '../ExportConfig';

describe('ExportConfig', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<ExportConfig />);
    expect(baseElement).toBeTruthy();
  });
});
