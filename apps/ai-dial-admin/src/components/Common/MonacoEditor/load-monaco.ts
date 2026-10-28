import { loader } from '@monaco-editor/react';

import {
  JSON_MARKER_OWNER,
  JSON_WORKER_LABEL,
  MONACO_TRANSLATED_LOCALES,
} from '@/src/components/Common/MonacoEditor/constants';
import type { BundledMonaco, MonacoTranslate } from '@/src/components/Common/MonacoEditor/models';
import { translateJsonMarkerMessage } from '@/src/components/Common/MonacoEditor/utils';

let monacoPromise: Promise<BundledMonaco> | null = null;
let loadedMonaco: BundledMonaco | null = null;
let translate: MonacoTranslate | null = null;

/** Sets the `t()` that JSON validation messages are translated with; the latest call wins. */
export const setMonacoTranslate = (t: MonacoTranslate) => {
  translate = t;
};

/** The bundled instance once `loadMonaco` has resolved, so an editor mounted later need not wait a tick. */
export const getLoadedMonaco = (): BundledMonaco | null => loadedMonaco;

const setWorkers = () => {
  self.MonacoEnvironment = {
    getWorker(_workerId: string, label: string) {
      if (label === JSON_WORKER_LABEL) {
        return new Worker(new URL('./workers/json.worker.ts', import.meta.url));
      }
      return new Worker(new URL('./workers/editor.worker.ts', import.meta.url));
    },
  };
};

// The bundle sets `globalThis._VSCODE_NLS_MESSAGES`, which Monaco reads while its modules evaluate, so it
// must land before the entry is imported.
const loadMessages = async (locale: string) => {
  const monacoLocale = locale.toLowerCase();
  if (MONACO_TRANSLATED_LOCALES.includes(monacoLocale)) {
    await import(`monaco-editor/esm/nls.messages.${monacoLocale}.js`);
  }
};

// The JSON language service only produces English, so its markers are rewritten once they land. Writing them
// back fires this listener again; that pass finds every message already translated and writes nothing.
// The subscription is never disposed on purpose: Monaco is loaded once per page, and the listener must live as
// long as it does.
const translateJsonMarkers = (monaco: BundledMonaco) => {
  monaco.editor.onDidChangeMarkers((uris) => {
    const t = translate;
    if (!t) return;

    uris.forEach((uri) => {
      const model = monaco.editor.getModel(uri);
      if (!model) return;

      const markers = monaco.editor.getModelMarkers({ owner: JSON_MARKER_OWNER, resource: uri });
      let hasChanges = false;
      const translated = markers.map((marker) => {
        const message = translateJsonMarkerMessage(marker, t);
        if (message === marker.message) return marker;
        hasChanges = true;
        return { ...marker, message };
      });

      if (hasChanges) {
        monaco.editor.setModelMarkers(model, JSON_MARKER_OWNER, translated);
      }
    });
  });
};

const load = async (locale: string): Promise<BundledMonaco> => {
  setWorkers();
  await loadMessages(locale);
  const { monaco } = await import('@/src/components/Common/MonacoEditor/monaco-entry');
  translateJsonMarkers(monaco);
  loader.config({ monaco });
  loadedMonaco = monaco;
  return monaco;
};

const loadOrForget = async (locale: string): Promise<BundledMonaco> => {
  try {
    return await load(locale);
  } catch (error) {
    // A failed chunk load is retried by the next editor that mounts instead of being cached.
    monacoPromise = null;
    throw error;
  }
};

/**
 * Loads the bundled Monaco once per page, in the given locale, and hands it to `@monaco-editor/react` so the
 * library never fetches its CDN copy. Monaco reads its UI text once, so the first locale wins.
 */
export const loadMonaco = (locale: string): Promise<BundledMonaco> => {
  monacoPromise ??= loadOrForget(locale);
  return monacoPromise;
};
