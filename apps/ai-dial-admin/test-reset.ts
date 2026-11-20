interface EvaluatedModule {
  promise?: unknown;
  exports?: unknown;
  mockedExports?: unknown;
  evaluated: boolean;
  importers: Set<string>;
}

interface VitestWorkerState {
  evaluatedModules: { idToModuleMap: Map<string, EvaluatedModule> };
}

interface VitestGlobals {
  __vitest_worker__?: VitestWorkerState;
}

const VITEST_RUNTIME_PATHS = [/\/vitest\/dist\//, /vitest-virtual-\w+\/dist/, /@vitest\/dist/];

const workerState = (globalThis as VitestGlobals).__vitest_worker__;

if (!workerState?.evaluatedModules?.idToModuleMap) {
  throw new Error('test-reset.ts: vitest internals changed; per-file module reset is unavailable');
}

workerState.evaluatedModules.idToModuleMap.forEach((node, path) => {
  if (VITEST_RUNTIME_PATHS.some((pattern) => pattern.test(path))) {
    return;
  }
  node.promise = undefined;
  node.exports = undefined;
  node.mockedExports = undefined;
  node.evaluated = false;
  node.importers.clear();
});
