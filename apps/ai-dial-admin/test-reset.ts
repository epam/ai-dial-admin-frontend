interface EvaluatedModule {
  id: string;
  url: string;
  file?: string;
}

interface EvaluatedModules {
  idToModuleMap: Map<string, EvaluatedModule>;
  urlToIdModuleMap: Map<string, EvaluatedModule>;
  fileToModulesMap: Map<string, Set<EvaluatedModule>>;
}

interface VitestGlobals {
  __vitest_worker__?: { evaluatedModules?: EvaluatedModules };
}

const VITEST_RUNTIME_PATHS = [/\/vitest\/dist\//, /vitest-virtual-\w+\/dist/, /@vitest\/dist/];

const modules = (globalThis as VitestGlobals).__vitest_worker__?.evaluatedModules;

if (!modules?.idToModuleMap || !modules.urlToIdModuleMap || !modules.fileToModulesMap) {
  throw new Error('test-reset.ts: vitest internals changed; per-file module reset is unavailable');
}

if (typeof document !== 'undefined') {
  document.body.replaceChildren();
  document.body.getAttributeNames().forEach((name) => document.body.removeAttribute(name));
}

if (typeof window !== 'undefined') {
  window.localStorage.clear();
  window.sessionStorage.clear();
}

modules.idToModuleMap.forEach((node, id) => {
  if (VITEST_RUNTIME_PATHS.some((pattern) => pattern.test(id))) {
    return;
  }
  modules.idToModuleMap.delete(id);
  modules.urlToIdModuleMap.delete(node.url);
  if (node.file) {
    const siblings = modules.fileToModulesMap.get(node.file);
    siblings?.delete(node);
    if (siblings?.size === 0) {
      modules.fileToModulesMap.delete(node.file);
    }
  }
});
