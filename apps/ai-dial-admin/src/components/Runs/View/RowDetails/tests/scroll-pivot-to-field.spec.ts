import { describe, expect, test, vi } from 'vitest';

import { scrollPivotToField } from '../ExecutionRowDetailPivotTable';

describe('scrollPivotToField', () => {
  test('no-ops when container or field key is missing', () => {
    expect(() => scrollPivotToField(null, 'http')).not.toThrow();
    expect(() => scrollPivotToField(document.createElement('div'), null)).not.toThrow();
  });

  test('scrolls the matching data-field-key element into view', () => {
    const container = document.createElement('div');
    const cell = document.createElement('button');
    cell.setAttribute('data-field-key', 'httpStatusCode');
    const scrollIntoView = vi.fn();
    cell.scrollIntoView = scrollIntoView;
    container.appendChild(cell);

    scrollPivotToField(container, 'httpStatusCode');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  });
});
