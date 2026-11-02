import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DIFF_HIGHLIGHT_CLASS_BY_KIND } from '@/src/components/Runs/Details/ValuePopups/constants';
import HighlightedEditor from '@/src/components/Runs/Details/ValuePopups/HighlightedEditor';
import { TextDiffKind } from '@/src/models/text-diff';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  createDecorationsCollection: vi.fn(),
  getPositionAt: vi.fn((offset: number) => ({ lineNumber: 1, column: offset + 1 })),
}));

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, onMount }: { value?: string; onMount?: (editor: unknown, monaco: unknown) => void }) => {
    const editor = {
      getModel: () => ({ getPositionAt: mocks.getPositionAt }),
      createDecorationsCollection: (decorations: unknown[]) => {
        mocks.createDecorationsCollection(decorations);
        return { clear: mocks.clear };
      },
    };
    const monaco = {
      Range: class {
        constructor(
          public startLineNumber: number,
          public startColumn: number,
          public endLineNumber: number,
          public endColumn: number,
        ) {}
      },
    };
    // Monaco mounts once, after its first render.
    queueMicrotask(() => onMount?.(editor, monaco));
    return <pre>{value}</pre>;
  },
}));

describe('HighlightedEditor', () => {
  test('Should decorate each range with the class of its diff kind on mount', async () => {
    render(
      <HighlightedEditor
        text="one two three"
        language="plaintext"
        highlights={[{ start: 4, end: 7, kind: TextDiffKind.Changed }]}
      />,
    );
    await Promise.resolve();

    expect(mocks.createDecorationsCollection).toHaveBeenCalledOnce();
    expect(mocks.createDecorationsCollection).toHaveBeenCalledWith([
      {
        range: expect.objectContaining({ startColumn: 5, endColumn: 8 }),
        options: { inlineClassName: DIFF_HIGHLIGHT_CLASS_BY_KIND[TextDiffKind.Changed] },
      },
    ]);
  });
});
