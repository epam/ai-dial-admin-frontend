import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import type { editor } from 'monaco-editor';

type MarkerListener = (uris: unknown[]) => void;

const { fakeMonaco, loaderConfig, markersByOwner, fireMarkers, resetMarkers } = vi.hoisted(() => {
  const markersByOwner: Record<string, Partial<editor.IMarker>[]> = {};
  const listeners: MarkerListener[] = [];
  const model = {};
  const fakeMonaco = {
    editor: {
      onDidChangeMarkers: vi.fn((listener: MarkerListener) => {
        listeners.push(listener);
        return { dispose: vi.fn() };
      }),
      getModel: vi.fn(() => model),
      getModelMarkers: vi.fn(({ owner }: { owner: string }) => markersByOwner[owner] ?? []),
      setModelMarkers: vi.fn((_model: unknown, owner: string, markers: Partial<editor.IMarker>[]) => {
        markersByOwner[owner] = markers;
      }),
    },
  };
  return {
    fakeMonaco,
    loaderConfig: vi.fn(),
    markersByOwner,
    fireMarkers: () => listeners.forEach((listener) => listener(['inmemory://model/1'])),
    resetMarkers: () => {
      listeners.length = 0;
      Object.keys(markersByOwner).forEach((owner) => delete markersByOwner[owner]);
    },
  };
});

vi.mock('@monaco-editor/react', () => ({ loader: { config: loaderConfig } }));
vi.mock('@/src/components/Common/MonacoEditor/monaco-entry', () => ({ monaco: fakeMonaco }));

const NLS_GLOBAL = '_VSCODE_NLS_MESSAGES';

// `load-monaco` keeps its promise at module level; each test starts from a fresh copy.
const importLoadMonaco = async () => {
  vi.resetModules();
  return import('@/src/components/Common/MonacoEditor/load-monaco');
};

describe('loadMonaco', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMarkers();
    delete (globalThis as Record<string, unknown>)[NLS_GLOBAL];
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[NLS_GLOBAL];
  });

  test('hands the bundled instance to @monaco-editor/react once across calls', async () => {
    const { loadMonaco, getLoadedMonaco } = await importLoadMonaco();

    expect(getLoadedMonaco()).toBeNull();
    const first = loadMonaco('en');
    const second = loadMonaco('en');

    expect(first).toBe(second);
    expect(await first).toBe(fakeMonaco);
    expect(loaderConfig).toHaveBeenCalledOnce();
    expect(loaderConfig).toHaveBeenCalledWith({ monaco: fakeMonaco });
    expect(getLoadedMonaco()).toBe(fakeMonaco);
  });

  test('configures the workers before Monaco loads', async () => {
    const { loadMonaco } = await importLoadMonaco();

    await loadMonaco('en');

    expect(typeof self.MonacoEnvironment?.getWorker).toBe('function');
  });

  test("loads Microsoft's message bundle for a translated locale, whatever its case", async () => {
    const { loadMonaco } = await importLoadMonaco();

    await loadMonaco('DE');

    const messages = (globalThis as Record<string, unknown>)[NLS_GLOBAL] as string[];
    expect(messages[1]).toBe('Eingabe');
  });

  test('loads no message bundle for a locale Microsoft does not translate', async () => {
    const { loadMonaco } = await importLoadMonaco();

    await loadMonaco('en');

    expect((globalThis as Record<string, unknown>)[NLS_GLOBAL]).toBeUndefined();
  });

  test('loads again on the next call after a failed load', async () => {
    const { loadMonaco } = await importLoadMonaco();
    loaderConfig.mockImplementationOnce(() => {
      throw new Error('chunk failed');
    });

    await expect(loadMonaco('en')).rejects.toThrow('chunk failed');
    expect(await loadMonaco('en')).toBe(fakeMonaco);
    expect(loaderConfig).toHaveBeenCalledTimes(2);
  });
});

describe('loadMonaco — JSON marker translation', () => {
  const t = vi.fn((key: string) => `translated:${key}`);

  beforeEach(() => {
    vi.clearAllMocks();
    resetMarkers();
  });

  const loadWithTranslate = async () => {
    const { loadMonaco, setMonacoTranslate } = await importLoadMonaco();
    setMonacoTranslate(t);
    await loadMonaco('en');
  };

  test('rewrites the JSON markers with their translated messages', async () => {
    await loadWithTranslate();
    markersByOwner.json = [{ code: '514', message: 'Expected comma', startLineNumber: 3 }];

    fireMarkers();

    expect(fakeMonaco.editor.setModelMarkers).toHaveBeenCalledOnce();
    expect(markersByOwner.json).toEqual([
      { code: '514', message: 'translated:MonacoJsonError.CommaExpected', startLineNumber: 3 },
    ]);
  });

  test('writes nothing on the pass its own write triggers', async () => {
    await loadWithTranslate();
    markersByOwner.json = [{ code: '514', message: 'Expected comma' }];

    fireMarkers();
    fireMarkers();

    expect(fakeMonaco.editor.setModelMarkers).toHaveBeenCalledOnce();
  });

  test('leaves the markers of other owners untouched', async () => {
    await loadWithTranslate();
    markersByOwner['row-limit'] = [{ code: '514', message: 'Expected comma' }];

    fireMarkers();

    expect(fakeMonaco.editor.setModelMarkers).not.toHaveBeenCalled();
    expect(fakeMonaco.editor.getModelMarkers).toHaveBeenCalledWith({ owner: 'json', resource: 'inmemory://model/1' });
  });

  test('translates nothing until a translator is registered', async () => {
    const { loadMonaco } = await importLoadMonaco();
    await loadMonaco('en');
    markersByOwner.json = [{ code: '514', message: 'Expected comma' }];

    fireMarkers();

    expect(fakeMonaco.editor.setModelMarkers).not.toHaveBeenCalled();
  });
});
