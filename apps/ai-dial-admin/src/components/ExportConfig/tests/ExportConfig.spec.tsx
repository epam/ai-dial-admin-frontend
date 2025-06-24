import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ExportConfig from '../ExportConfig';

describe('ExportConfig', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<ExportConfig />);
    expect(baseElement).toBeTruthy();
  });
});
