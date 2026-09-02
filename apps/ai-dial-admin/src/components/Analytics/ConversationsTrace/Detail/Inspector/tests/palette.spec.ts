import { describe, expect, test } from 'vitest';

import { SPAN_KIND_CHIP_CLASS, SPAN_KIND_CLASS } from '@/src/constants/analytics/conversations-trace';
import { SpanKind } from '@/src/models/analytics/conversations-trace';

// The hue is the part that has to agree; the shape does not. A filter control is outlined and a rail badge is
// filled, so only the `text-*` token is compared.
const hueOf = (classes: string): string | undefined => classes.split(' ').find((name) => name.startsWith('text-'));

describe('the kind palette is one palette', () => {
  // One hop rendered two colours on one screen is the defect this guards. It used to need a bridge between an
  // event set and a kind set; both the tree and the rail now read `SpanKind` directly, so agreement is a
  // property of one table rather than of a mapping between two.
  test.each(Object.values(SpanKind))('%s reads the same hue in the rail as in the tree', (kind) => {
    expect(hueOf(SPAN_KIND_CLASS[kind])).toBe(hueOf(SPAN_KIND_CHIP_CLASS[kind]));
  });

  test('every kind states a hue at all', () => {
    Object.values(SpanKind).forEach((kind) => expect(hueOf(SPAN_KIND_CLASS[kind])).toBeDefined());
  });
});
