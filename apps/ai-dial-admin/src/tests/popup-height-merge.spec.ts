import { mergeClasses } from '@epam/ai-dial-ui-kit';
import { describe, expect, test } from 'vitest';

// The kit's `Popup` base classes end in `md:h-auto`; issue #5197.
const POPUP_BASE = 'relative flex w-full max-h-full flex-col rounded-xl bg-layer-raised md:h-auto';

describe('Popup height merge (ui-kit mergeClasses)', () => {
  test.each(['md:h-[800px]', 'md:h-[80vh]', 'md:h-[754px]'])('replaces the kit md:h-auto with %s', (height) => {
    const merged = mergeClasses(POPUP_BASE, height);

    expect(merged.split(' ')).toContain(height);
    expect(merged.split(' ')).not.toContain('md:h-auto');
  });

  test('keeps md:h-auto beside an unprefixed height, so that height is ignored at desktop widths', () => {
    const merged = mergeClasses(POPUP_BASE, 'h-[800px]').split(' ');

    expect(merged).toContain('h-[800px]');
    expect(merged).toContain('md:h-auto');
  });
});
